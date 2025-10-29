import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Chat } from '@google/genai';
import { useLiveConversation } from './hooks/useLiveConversation';
import { ControlButton } from './components/ControlButton';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { ChatInput } from './components/ChatInput';
import { decode, decodeAudioData } from './services/audioUtils';

const App: React.FC = () => {
  const {
    status: voiceStatus,
    error,
    startConversation,
    stopConversation,
  } = useLiveConversation();

  const [isThinking, setIsThinking] = useState(false);
  const [isSpeakingText, setIsSpeakingText] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  const isSessionActive = voiceStatus === 'listening' || voiceStatus === 'speaking';

  const handleStartClick = () => {
    startConversation();
  };

  const handleEndClick = () => {
    stopConversation();
  };

  const speak = async (text: string) => {
    if (!process.env.API_KEY || !text.trim()) return;

    if (!outputAudioContextRef.current) {
      try {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } catch (e) {
        console.error("Failed to create AudioContext", e);
        setAppError("Browser does not support audio playback.");
        return;
      }
    }
    const audioContext = outputAudioContextRef.current;

    setIsSpeakingText(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContext) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        source.onended = () => {
          setIsSpeakingText(false);
        };
      } else {
        setIsSpeakingText(false);
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setAppError(`Text-to-speech error: ${(e as Error).message}`);
      setIsSpeakingText(false);
    }
  };

  const handleSendText = async (text: string) => {
    if (!text.trim() || isThinking) return;
    
    setAppError(null);

    if (!chatRef.current) {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
    }

    setIsThinking(true);

    try {
      const response = await chatRef.current.sendMessage({ message: text });
      await speak(response.text);
    } catch (e) {
      const errorText = `Sorry, I encountered an error: ${(e as Error).message}`;
      setAppError(errorText);
      await speak(errorText);
    } finally {
      setIsThinking(false);
    }
  };

  const overallStatus = isThinking ? 'connecting' : isSpeakingText ? 'speaking' : voiceStatus;
  const displayedError = error || appError;

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"></div>
      <div className="absolute inset-[-200px] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.06)_0%,_rgba(59,130,246,0)_50%)]"></div>

      <div className="flex-1 flex flex-col h-full w-full relative">
        {/* Centered Mic UI */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-64 h-64">
              <VoiceVisualizer status={overallStatus} />
              {!isSessionActive ? (
                <ControlButton
                  onClick={handleStartClick}
                  status={overallStatus}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500 pointer-events-none">
                  <p className="font-medium text-lg capitalize">{overallStatus}</p>
                </div>
              )}
            </div>
            {!isSessionActive && (
              <p className="mt-6 text-gray-500 text-lg text-center max-w-md px-4">
                {voiceStatus === 'connecting' ? 'Connecting...' : 'Tap the microphone to start'}
              </p>
            )}
          </div>
        </div>

        {/* Chat Input at Bottom (only when active) */}
        {isSessionActive && (
          <div className="absolute bottom-0 left-0 right-0 w-full max-w-4xl mx-auto px-4 mb-6">
            <ChatInput
              onSend={handleSendText}
              onEndCall={handleEndClick}
              disabled={isThinking || isSpeakingText}
              isLoading={isThinking}
              isSessionActive={isSessionActive}
            />
          </div>
        )}
      </div>

      {/* Error Overlay - Light Theme Styled */}
      {displayedError && (
        <div className="absolute bottom-1/4 mb-4 px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center text-sm z-50 max-w-md mx-auto">
          <p>{displayedError}</p>
        </div>
      )}
    </div>
  );
};

export default App;