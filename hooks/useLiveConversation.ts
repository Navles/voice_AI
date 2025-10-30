
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
const VOICE_RMS_THRESHOLD = 0.005; // Lowered threshold for better voice detection
const SILENCE_TIMEOUT_MS = 1500; // Shorter silence timeout for better responsiveness
const MIN_VOICE_DURATION_MS = 300; // Minimum duration to consider as voice input

export const useLiveConversation = () => {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  // interimTranscript: streaming, partial transcript for UI
  // finalTranscript: only set when transcript is finalized (silence or server final flag)
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');

  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  // Keep a short silence timeout to finalize transcripts quickly after user stops speaking
  const SILENCE_TIMEOUT_MS = 1500; // ms to wait before finalizing partial transcript
  // Voice activity detection threshold
  const VOICE_RMS_THRESHOLD = 0.005;
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
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  const stopConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  // Finalize the accumulated transcript (called on silence or server final flag)
  const finalizeTranscript = useCallback(() => {
    const transcript = transcriptAccumulatorRef.current.trim();
    if (transcript) {
      console.log('Finalizing transcript:', transcript);
      setFinalTranscript(transcript);
      transcriptAccumulatorRef.current = '';
      setInterimTranscript('');
    }
  }, []);
  
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support microphone access");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Verify we got audio tracks
      if (!stream.getAudioTracks().length) {
        throw new Error("No audio track available");
      }

      // Check if track is actually receiving audio
      const track = stream.getAudioTracks()[0];
      if (!track.enabled || track.muted) {
        throw new Error("Microphone is muted or disabled");
      }

      mediaStreamRef.current = stream;
      
      // Initialize audio contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: INPUT_SAMPLE_RATE 
      });
      
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: OUTPUT_SAMPLE_RATE 
      });

      return stream;
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        throw new Error("Microphone access was denied. Please allow microphone access and try again.");
      }
      throw err;
    }
  }, []);

  const startConversation = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setInterimTranscript('');
    setFinalTranscript('');
    transcriptAccumulatorRef.current = '';

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }

      // Initialize audio context and get stream
      const stream = await initializeAudioContext();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      // scheduleSilenceTimeout needs to be accessible by both onopen and onmessage
      const scheduleSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          console.log('Silence detected, finalizing transcript');
          finalizeTranscript();
          silenceTimeoutRef.current = null;
        }, SILENCE_TIMEOUT_MS) as unknown as number;
      };

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

            // start a silence timeout to finalize any partial transcript if user doesn't speak
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
            // Debug: handle server-provided inputTranscription
            const transcription = message.serverContent?.inputTranscription;
            if (transcription) {
              const tAny = transcription as any;
              const text = (tAny.text || tAny.transcript || '').toString();
              const isFinal = !!tAny.isFinal || !!tAny.final || !!tAny.is_final;
              console.log('Received transcript chunk:', { text, isFinal });

              if (text.trim()) {
                // accumulate partial text
                if (transcriptAccumulatorRef.current) transcriptAccumulatorRef.current += ' ';
                transcriptAccumulatorRef.current += text.trim();
                // update interim transcript for UI
                setInterimTranscript(transcriptAccumulatorRef.current);
                lastTranscriptUpdateRef.current = Date.now();

                // If server marks final, finalize immediately
                if (isFinal) {
                  finalizeTranscript();
                } else {
                  // otherwise schedule finalize after silence
                  // reset and reschedule silence timer
                  if (silenceTimeoutRef.current) {
                    window.clearTimeout(silenceTimeoutRef.current);
                    silenceTimeoutRef.current = null;
                  }
                  scheduleSilenceTimeout();
                }
              }
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
                    setInterimTranscript('');
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
  }, [cleanup, stopConversation, finalizeTranscript, initializeAudioContext]);

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
    interimTranscript,
    finalTranscript,
    acknowledgeFinalTranscript: () => setFinalTranscript(''),
  };
};
