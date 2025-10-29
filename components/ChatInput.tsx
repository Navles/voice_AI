import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onEndCall: () => void;
  disabled: boolean;
  isLoading: boolean;
  isSessionActive?: boolean;
}

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M16.5 12c0-1.77-.78-3.37-2.03-4.47l-1.09-1.09C12.88 5.88 12.44 5.5 12 5.5s-.88.38-1.38.94l-1.09 1.09C8.28 8.63 7.5 10.23 7.5 12s.78 3.37 2.03 4.47l1.09 1.09c.5.56.94.94 1.38.94s.88-.38 1.38-.94l1.54-1.51A5.98 5.98 0 0114 12zm-6 0c0 .67-.17 1.28-.46 1.82L12 15.33l-1.54-1.51A5.98 5.98 0 0110 12c0-.67.17-1.28.46-1.82L12 8.67l1.54 1.51A5.98 5.98 0 0114 12zm-6 0c0-2.67-2.16-4.83-4.83-4.83v9.66C5.84 16.83 8 14.67 8 12zm12 0c0-2.67-2.16-4.83-4.83-4.83v9.66C17.84 16.83 20 14.67 20 12z" />
  </svg>
);

const EndCallIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12.38,16.47a1.1,1.1,0,0,1-.78,0,12.5,12.5,0,0,1-5.3-3.72A12.52,12.52,0,0,1,2.57,7.1a1.1,1.1,0,0,1,.46-1.42l2.36-1.57a1.1,1.1,0,0,1,1.29.21l2.4,3.21a1.1,1.1,0,0,1-.15,1.4l-1.5,1.5a.36.36,0,0,0,0,.51,10.21,10.21,0,0,0,4.88,4.88.36.36,0,0,0,.51,0l1.5-1.5a1.1,1.1,0,0,1,1.4-.15l3.21,2.4a1.1,1.1,0,0,1,.21,1.29l-1.57,2.36A1.1,1.1,0,0,1,12.38,16.47Z" />
  </svg>
);

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
);

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onEndCall,
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
      // Limit max height to ~100px (about 5 lines)
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + "px";
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSend(trimmed);
      setInputValue("");
    }
  };

  const isSendDisabled = disabled || !inputValue.trim();

  return (
    <div className="w-full flex justify-center border border-black-400 rounded-lg">
      <div className="max-w-5xl bg-gray-50 rounded-xl shadow-sm flex flex-col px-4 py-3 w-full">
        {/* Textarea - grows vertically */}
        <div className="flex-1 mb-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message to start the conversation"
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-base resize-none py-1 max-h-24 leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Button row: End call (left), Send (right) */}
        <div className="flex items-center justify-between">
          {isSessionActive && (
            <button
              onClick={onEndCall}
              className="flex items-center text-red-600 font-medium text-sm hover:bg-red-100 hover:rounded px-2 py-1 focus:outline-none"
              aria-label="End call"
              type="button"
            >
              <EndCallIcon /> End call
            </button>
          )}

          <div className="flex-1"></div> {/* Spacer */}

          <button
            onClick={handleSubmit}
            disabled={isSendDisabled}
            className={`flex items-center justify-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-opacity ${
              isSendDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
            aria-label="Send message"
          >
            {isLoading ? <LoadingSpinner /> : <SendIcon />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
};