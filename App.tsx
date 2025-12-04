import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import type { Chat } from "@google/genai";
import { useLiveConversation } from "./hooks/useLiveConversation";
import { ChatInput } from "./components/ChatInput";
import { ConversationHistoryPanel } from "./components/ConversationHistoryPanel";
import { MessageList } from "./components/MessageList";
import { enhancedMcpClient as mcpClient } from "./services/EnhancedMCPClient";
import { WeatherDisplay } from "./components/Weather";
import {
  conversationHistory,
  ConversationMessage,
} from "./services/conversationHistory";
import { DataDisplay } from "./components/DataDisplay";

const App: React.FC = () => {
  const {
    status: voiceStatus,
    error,
    startConversation,
    stopConversation,
    interimTranscript,
    finalTranscript,
    acknowledgeFinalTranscript,
  } = useLiveConversation();

  const [isThinking, setIsThinking] = useState(false);
  const [isSpeakingText, setIsSpeakingText] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [mcpToolResult, setMcpToolResult] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  // 2. Add new state variables (add these after existing useState declarations)
  const [dataResult, setDataResult] = useState<any>(null);
const [dataType, setDataType] = useState<'severity' | 'truck' | 'dic' | 'feedback' | 'defect' | 'chart' | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voicesLoadedRef = useRef<boolean>(false);
  const isProcessingVoiceRef = useRef<boolean>(false);

  const isSessionActive =
    voiceStatus === "listening" || voiceStatus === "speaking";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load voices on mount (needed for some browsers)
  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
      console.log(`Loaded ${voices.length} voices`);
    }

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      voicesLoadedRef.current = true;
      console.log(`Loaded ${voices.length} voices`);
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
    };
  }, []);

  // Sync messages with conversation history
  useEffect(() => {
    const currentConv = conversationHistory.getCurrentConversation();
    if (currentConv) {
      setMessages(currentConv.messages);
    }
  }, []);

  // Cleanup on unmount - cancel any ongoing speech
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Cancel TTS when voice session becomes active
  useEffect(() => {
    if (isSessionActive) {
      console.log("Voice session started, cancelling any ongoing TTS");
      window.speechSynthesis.cancel();
      setIsSpeakingText(false);
    }
  }, [isSessionActive]);

  const handleStartClick = () => {
    window.speechSynthesis.cancel();
    setIsSpeakingText(false);
    conversationHistory.createConversation();
    setMessages([]);
    isProcessingVoiceRef.current = false;
    startConversation();
  };

  const handleEndClick = () => {
    isProcessingVoiceRef.current = false;
    stopConversation();
  };

  const speak = async (text: string, forceSpeech: boolean = false) => {
    if (!text.trim()) return;

    // Skip TTS during voice session unless forced
    if (isSessionActive && !forceSpeech) {
      console.log("Voice session active, skipping TTS");
      return;
    }

    try {
      setIsSpeakingText(true);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.includes("Female") ||
              voice.name.includes("Google") ||
              voice.name.includes("Natural"))
        ) || voices.find((voice) => voice.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log("Using voice:", preferredVoice.name);
      }

      utterance.onend = () => {
        console.log("Speech completed");
        setIsSpeakingText(false);
      };

      utterance.onerror = (error) => {
        console.error("TTS Error:", error);
        setAppError(`Text-to-speech error: ${error.error}`);
        setIsSpeakingText(false);
      };

      window.speechSynthesis.speak(utterance);
      console.log("Speech started");
    } catch (e) {
      console.error("TTS Error:", e);
      setAppError(`Text-to-speech error: ${(e as Error).message}`);
      setIsSpeakingText(false);
    }
  };

  const handleSendText = async (text: string, fromVoice: boolean = false) => {
    if (!text.trim() || isThinking) {
      console.log("Skipping empty or duplicate request");
      return;
    }

    if (fromVoice && isProcessingVoiceRef.current) {
      console.log("Already processing a voice request, skipping...");
      return;
    }

    if (fromVoice) {
      isProcessingVoiceRef.current = true;
    }

    setAppError(null);
    setMcpToolResult(null);
    setDataResult(null);
    setDataType(null);

    console.log(`Processing ${fromVoice ? "voice" : "text"} input:`, text);

    const userMsg = conversationHistory.addMessage("user", text);
    setMessages((prev) => [...prev, userMsg]);

    const toolAnalysis = mcpClient.analyzeQuery(text);

    if (!chatRef.current) {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({ model: "gemini-2.5-flash" });
    }

    setIsThinking(true);

    try {
      let responseText = "";
      let toolCallInfo = undefined;

      if (
        toolAnalysis.shouldUseTool &&
        toolAnalysis.toolName &&
        toolAnalysis.args
      ) {
        console.log(
          "Calling MCP tool:",
          toolAnalysis.toolName,
          toolAnalysis.args
        );

        // Determine which server to use
        const serverName = ["get_weather", "get_forecast"].includes(
          toolAnalysis.toolName
        )
          ? "weather"
          : "severity";

        const toolResult = await mcpClient.callTool(
          serverName,
          toolAnalysis.toolName,
          toolAnalysis.args
        );

        if (toolResult.error) {
          setAppError(`Tool error: ${toolResult.error}`);
          responseText = `I encountered an error trying to get that information: ${toolResult.error}`;
        } else {
          const resultSummary = JSON.stringify(toolResult.result, null, 2);

          // Handle different data types
          const weatherTools = ["get_weather", "get_forecast"];
          const severityTools = ["get_severity", "get_truck_data"];
          const dicTools = ["get_dic_overview"];
          const feedbackTools = ["search_nea_feedback"];
          const defectTools = ["search_defect_notice"];
          const chartTools = ["get_chart_data"];

          if (weatherTools.includes(toolAnalysis.toolName)) {
            setMcpToolResult(resultSummary);
          } else if (severityTools.includes(toolAnalysis.toolName)) {
            setDataResult(toolResult.result);
            setDataType(
              toolAnalysis.toolName === "get_severity" ? "severity" : "truck"
            );
          } else if (dicTools.includes(toolAnalysis.toolName)) {
            setDataResult(toolResult.result);
            setDataType("dic");
          } else if (feedbackTools.includes(toolAnalysis.toolName)) {
            setDataResult(toolResult.result);
            setDataType("feedback");
          } else if (defectTools.includes(toolAnalysis.toolName)) {
            setDataResult(toolResult.result);
            setDataType("defect");
          } else if (chartTools.includes(toolAnalysis.toolName)) {
            setDataResult(toolResult.result);
            setDataType("chart");
          }

          toolCallInfo = [
            {
              tool: toolAnalysis.toolName,
              args: toolAnalysis.args,
              result: toolResult.result,
            },
          ];

          const contextMessage = `I used the ${toolAnalysis.toolName} tool and got this data: ${resultSummary}. 

User's original question was: "${text}"

Please provide a natural, conversational response based on this data. Be specific and mention the actual numbers and key information from the data.`;

          const response = await chatRef.current.sendMessage({
            message: contextMessage,
          });
          responseText = response.text;
        }
      } else {
        const response = await chatRef.current.sendMessage({ message: text });
        responseText = response.text;
      }

      const assistantMsg = conversationHistory.addMessage(
        "assistant",
        responseText,
        toolCallInfo
      );
      setMessages((prev) => [...prev, assistantMsg]);

      if (!fromVoice) {
        await speak(responseText);
      }

      console.log("Response completed successfully");
    } catch (e) {
      const errorText = `Sorry, I encountered an error: ${
        (e as Error).message
      }`;
      setAppError(errorText);

      if (!fromVoice) {
        await speak(errorText);
      }

      const errorMsg = conversationHistory.addMessage("system", errorText);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      if (fromVoice) {
        isProcessingVoiceRef.current = false;
      }
    }
  };

  // Handle finalized voice transcript
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim()) {
      console.log("Final transcript received:", finalTranscript);

      const run = async () => {
        await handleSendText(finalTranscript, true); // Pass true to indicate from voice

        try {
          acknowledgeFinalTranscript?.();
        } catch (error) {
          console.error("Error acknowledging transcript:", error);
        }
      };

      void run();
    }
  }, [finalTranscript]);

  const handleSelectConversation = (conversationId: string) => {
    conversationHistory.setCurrentConversation(conversationId);
    const conv = conversationHistory.getConversation(conversationId);
    if (conv) {
      setMessages(conv.messages);
      if (conv.messages.length > 0) {
        const lastMessage = conv.messages[conv.messages.length - 1];
        if (lastMessage.role === "assistant") {
          speak(lastMessage.content);
        }
      }
    }
    setShowHistory(false);
  };

  const overallStatus = isThinking
    ? "connecting"
    : isSpeakingText
    ? "speaking"
    : voiceStatus;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                AI Assistant
              </h1>
              {/* <p className="text-xs text-gray-500">with MCP Integration</p> */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSessionActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {overallStatus === "speaking" ? "Speaking" : "Listening"}
              </div>
            )}
            {interimTranscript && (
              <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm max-w-xs truncate">
                {interimTranscript}
              </div>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 && !isSessionActive ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to AI Assistant
                </h2>
                <p className="text-lg text-gray-600">
                  Start a conversation by clicking the microphone or type your
                  message below
                </p>
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Weather Information
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ask about current weather or forecasts for any location
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Voice Conversation
                      </h3>
                      <p className="text-sm text-gray-600">
                        Natural voice interaction with real-time responses
                      </p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <MessageList messages={messages} isThinking={isThinking} />
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
      {/* Data Display Overlay */}
      {dataResult && dataType && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <DataDisplay
            data={dataResult}
            type={dataType}
            onClose={() => {
              setDataResult(null);
              setDataType(null);
            }}
          />
        </div>
      )}

      {/* Weather Display Overlay */}
      {mcpToolResult && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <WeatherDisplay
            data={JSON.parse(mcpToolResult)}
            type={
              mcpToolResult.includes('"forecast":') ? "forecast" : "current"
            }
            onClose={() => setMcpToolResult(null)}
          />
        </div>
      )}

      {/* Error Display */}
      {appError && (
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800">{appError}</p>
            </div>
            <button
              onClick={() => setAppError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={(text) => handleSendText(text, false)}
            onEndCall={handleEndClick}
            onMicClick={handleStartClick}
            disabled={isThinking || isSpeakingText}
            isLoading={isThinking}
            isSessionActive={isSessionActive}
          />
        </div>
      </div>

      {/* Conversation History Panel */}
      <ConversationHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
};

export default App;
