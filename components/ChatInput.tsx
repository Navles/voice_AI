import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onEndCall: () => void;
  onMicClick?: () => void;
  disabled: boolean;
  isLoading: boolean;
  isSessionActive?: boolean;
}

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const MicIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
    />
  </svg>
);

const StopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-700"></div>
);

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onEndCall,
  onMicClick,
  disabled,
  isLoading,
  isSessionActive,
}) => {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current && !isSessionActive) {
      textareaRef.current.focus();
    }
  }, [isSessionActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInputValue("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const isSendDisabled = disabled || !inputValue.trim();

  return (
    <div className="relative">
      {isSessionActive && (
        <div className="flex justify-center mb-3">
          <button
            onClick={onEndCall}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm font-medium transition-colors"
            aria-label="End call"
          >
            <StopIcon />
            End Voice Session
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl p-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isSessionActive ? "Or type a message..." : "Message here to Start Conversation..."}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-[15px] resize-none py-2 px-3 max-h-[120px] leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          {/* Send/Mic Button */}
          <button
            type="button"
            onClick={(e) => {
              // If there's text, send it. Otherwise, trigger mic start if provided.
              if (inputValue.trim()) {
                // reuse submit handler
                handleSubmit(e as unknown as React.FormEvent);
              } else {
                if (typeof (onMicClick as any) === 'function') {
                  (onMicClick as any)();
                }
              }
            }}
            disabled={isLoading}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
            }`}
            aria-label={inputValue.trim() ? "Send message" : "Start voice"}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : inputValue.trim() ? (
              <SendIcon />
            ) : (
              <MicIcon />
            )}
          </button>
        </div>
      </form>

      {/* Helper Text */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          Voice Assistant can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};
