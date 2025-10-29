import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Chat } from '@google/genai';
import { useLiveConversation } from './hooks/useLiveConversation';
import { ControlButton } from './components/ControlButton';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { ChatInput } from './components/ChatInput';
import { decode, decodeAudioData } from './services/audioUtils';
import { enhancedMcpClient as mcpClient } from './services/EnhancedMCPClient';
import { WeatherDisplay } from './components/Weather';

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
  const [showHistory, setShowHistory] = useState(false);
  const [mcpToolResult, setMcpToolResult] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);

  const isSessionActive = voiceStatus === 'listening' || voiceStatus === 'speaking';

  const handleStartClick = () => {
    // Create new conversation when starting
    // conversationHistory.createConversation();
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
    setMcpToolResult(null);

    // Add user message to history
    // conversationHistory.addMessage('user', text);

    // Check if MCP tool should be used
    const toolAnalysis = mcpClient.analyzeQuery(text);

    if (!chatRef.current) {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash' });
    }

    setIsThinking(true);

    try {
      let responseText = '';

      // If MCP tool should be used, call it first
      if (toolAnalysis.shouldUseTool && toolAnalysis.toolName && toolAnalysis.args) {
        console.log('Calling MCP tool:', toolAnalysis.toolName, toolAnalysis.args);
        
        const toolResult = await mcpClient.callTool('weather', toolAnalysis.toolName!, toolAnalysis.args!);
        
        if (toolResult.error) {
          setAppError(`Tool error: ${toolResult.error}`);
          responseText = `I encountered an error trying to get that information: ${toolResult.error}`;
        } else {
          // Format the tool result for display
          const resultSummary = JSON.stringify(toolResult.result, null, 2);
          setMcpToolResult(resultSummary);

          // Create context message with tool result
          const contextMessage = `I used the ${toolAnalysis.toolName} tool and got this data: ${resultSummary}. 
          
User's original question was: "${text}"

Please provide a natural, conversational response based on this data.`;

          const response = await chatRef.current.sendMessage({ message: contextMessage });
          responseText = response.text;

          // Add assistant message with tool call info to history
    //       conversationHistory.addMessage('assistant', responseText, [
    //         {
    //           tool: toolAnalysis.toolName,
    //           args: toolAnalysis.args,
    //           result: toolResult.result,
    //         },
    //       ]);
    //     }
    //   } else {
    //     // Regular chat without tools
    //     const response = await chatRef.current.sendMessage({ message: text });
    //     responseText = response.text;

    //     // Add assistant message to history
    //     conversationHistory.addMessage('assistant', responseText);
    //   }

    //   await speak(responseText);
    // } catch (e) {
    //   const errorText = `Sorry, I encountered an error: ${(e as Error).message}`;
    //   setAppError(errorText);
    //   await speak(errorText);
    //   conversationHistory.addMessage('system', errorText);
    // } finally {
    //   setIsThinking(false);
    // }
  };

  // const handleSelectConversation = (conversationId: string) => {
  //   conversationHistory.setCurrentConversation(conversationId);
  //   const conv = conversationHistory.getConversation(conversationId);
  //   if (conv && conv.messages.length > 0) {
  //     const lastMessage = conv.messages[conv.messages.length - 1];
  //     speak(lastMessage.content);
  //   }
  // };

  const overallStatus = isThinking ? 'connecting' : isSpeakingText ? 'speaking' : voiceStatus;
  const displayedError = error || appError;

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100"></div>
      <div className="absolute inset-[-200px] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.06)_0%,_rgba(59,130,246,0)_50%)]"></div>

      {/* History Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowHistory(true)}
          className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white/90 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      </div>

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

        {/* Weather Display */}
        {mcpToolResult && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
            <WeatherDisplay
              data={JSON.parse(mcpToolResult)}
              type={mcpToolResult.includes('"forecast":') ? 'forecast' : 'current'}
              onClose={() => setMcpToolResult(null)}
            />
          </div>
        )}

        {/* Chat Input at Bottom */}
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

      {/* Error Overlay */}
      {displayedError && (
        <div className="absolute bottom-1/4 mb-4 px-4 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-center text-sm z-50 max-w-md mx-auto left-1/2 transform -translate-x-1/2">
          <p>{displayedError}</p>
        </div>
      )}

      {/* Conversation History Panel */}
      {/* <ConversationHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
      /> */}
    </div>
  );
};

export default App;