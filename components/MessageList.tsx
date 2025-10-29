/**
 * Message List Component
 * File: components/MessageList.tsx
 */
import React from 'react';
import type { ConversationMessage } from '../services/conversationHistory';

interface MessageListProps {
  messages: ConversationMessage[];
  isThinking?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isThinking }) => {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* Avatar */}
          {message.role !== 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className={`flex flex-col max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'system'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>

            {/* Tool Calls Display */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-2 text-xs">
                {message.toolCalls.map((call, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Used {call.tool.replace('_', ' ')}</span>
                    {call.result && (
                      <button
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={() => {
                          alert(JSON.stringify(call.result, null, 2));
                        }}
                      >
                        View data
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-1 text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* User Avatar */}
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Thinking...</div>
          </div>
        </div>
      )}
    </div>
  );
};
