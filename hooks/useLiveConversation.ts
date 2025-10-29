
import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: `LiveSession` is not an exported member of `@google/genai`.
// It is defined locally below. `Blob` type is imported for use in the `LiveSession` interface.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import type { Blob } from '@google/genai';
import type { ConversationStatus } from '../types';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';

// FIX: Define a local interface for `LiveSession` as it is not exported from the SDK.
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export const useLiveConversation = () => {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');

  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const SILENCE_TIMEOUT_MS = 3000; // Reduced timeout for faster response
  const VOICE_RMS_THRESHOLD = 0.01; // Adjusted threshold
  const suppressSendRef = useRef<boolean>(false);
  const transcriptAccumulatorRef = useRef<string>('');
  const lastTranscriptUpdateRef = useRef<number>(0);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const nextPlaybackStartTimeRef = useRef<number>(0);
  const audioPlaybackQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;
    
    audioPlaybackQueueRef.current.forEach(source => source.stop());
    audioPlaybackQueueRef.current.clear();
    nextPlaybackStartTimeRef.current = 0;
    
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    transcriptAccumulatorRef.current = '';
    setCurrentTranscript('');
  }, []);

  const stopConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  // Process accumulated transcript when silence is detected
  const processTranscript = useCallback(() => {
    const transcript = transcriptAccumulatorRef.current.trim();
    if (transcript) {
      console.log('Processing transcript:', transcript);
      setCurrentTranscript(transcript);
      transcriptAccumulatorRef.current = '';
    }
  }, []);
  
  const startConversation = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setCurrentTranscript('');
    transcriptAccumulatorRef.current = '';

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);

            const scheduleSilenceTimeout = () => {
              if (silenceTimeoutRef.current) {
                window.clearTimeout(silenceTimeoutRef.current);
              }
              silenceTimeoutRef.current = window.setTimeout(() => {
                console.log('Silence detected, processing transcript');
                processTranscript();
                silenceTimeoutRef.current = null;
              }, SILENCE_TIMEOUT_MS) as unknown as number;
            };

            scheduleSilenceTimeout();

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);

              // Compute RMS to detect voice activity
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                const v = inputData[i];
                sum += v * v;
              }
              const rms = Math.sqrt(sum / inputData.length);

              // If voice detected, reset silence timer
              if (rms > VOICE_RMS_THRESHOLD) {
                if (silenceTimeoutRef.current) {
                  window.clearTimeout(silenceTimeoutRef.current);
                  silenceTimeoutRef.current = null;
                }
                scheduleSilenceTimeout();
              }

              // Send audio to session when not suppressed
              if (!suppressSendRef.current) {
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle input transcriptions
            if (message.serverContent?.inputAudioTranscription?.transcript) {
              const transcript = message.serverContent.inputAudioTranscription.transcript;
              console.log('Received transcript:', transcript);
              
              // Accumulate transcripts
              transcriptAccumulatorRef.current += ' ' + transcript;
              lastTranscriptUpdateRef.current = Date.now();
            }

            // Handle audio responses
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              if (silenceTimeoutRef.current) {
                window.clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
              }
              
              suppressSendRef.current = true;
              setStatus('speaking');
              
              const outputContext = outputAudioContextRef.current;
              if (outputContext) {
                nextPlaybackStartTimeRef.current = Math.max(nextPlaybackStartTimeRef.current, outputContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, OUTPUT_SAMPLE_RATE, 1);
                const source = outputContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputContext.destination);
                source.addEventListener('ended', () => {
                  audioPlaybackQueueRef.current.delete(source);
                  if (audioPlaybackQueueRef.current.size === 0) {
                    setStatus('listening');
                    suppressSendRef.current = false;
                    
                    // Reset transcript accumulator after response
                    transcriptAccumulatorRef.current = '';
                    setCurrentTranscript('');
                  }
                });
                source.start(nextPlaybackStartTimeRef.current);
                nextPlaybackStartTimeRef.current += audioBuffer.duration;
                audioPlaybackQueueRef.current.add(source);
              }
            }
            
            if (message.serverContent?.interrupted) {
              audioPlaybackQueueRef.current.forEach(source => source.stop());
              audioPlaybackQueueRef.current.clear();
              nextPlaybackStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('API Error:', e);
            setError(`Connection error: ${(e as ErrorEvent).message || 'Unknown error'}`);
            setStatus('error');
            stopConversation();
          },
          onclose: () => {
            // Called when session closes
          },
        },
      });
      sessionRef.current = await sessionPromiseRef.current;

    } catch (e) {
      const err = e as Error;
      console.error('Failed to start conversation:', err);
      setError(`Failed to start: ${err.message}`);
      setStatus('error');
      cleanup();
    }
  }, [cleanup, stopConversation, processTranscript]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        stopConversation();
      }
    };
  }, [stopConversation]);

  return { 
    status, 
    error, 
    startConversation, 
    stopConversation,
    currentTranscript 
  };
};
