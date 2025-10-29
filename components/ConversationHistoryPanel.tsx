/**
 * Conversation History Panel
 * File: components/ConversationHistoryPanel.tsx
 */
import React, { useState, useEffect } from 'react';
import { conversationHistory, Conversation, ConversationMessage } from '../services/conversationHistory';

interface ConversationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationHistoryPanel: React.FC<ConversationHistoryPanelProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = () => {
    const allConvs = conversationHistory.getAllConversations();
    setConversations(allConvs);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  const handleLoadConversation = (convId: string) => {
    onSelectConversation(convId);
    onClose();
  };

  const handleDeleteConversation = (convId: string) => {
    if (confirm('Delete this conversation?')) {
      conversationHistory.deleteConversation(convId);
      loadConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(null);
      }
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all conversation history? This cannot be undone.')) {
      conversationHistory.clearAllConversations();
      loadConversations();
      setSelectedConv(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex overflow-hidden">
        {/* Sidebar - List of conversations */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-lg">History</h2>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversation history yet
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConv?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="font-medium text-sm truncate">{conv.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.messages.length} messages
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conv.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main content - Conversation details */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-lg">
              {selectedConv ? selectedConv.title : 'Select a conversation'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedConv ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a conversation to view details
              </div>
            ) : (
              <div className="space-y-4">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-100 ml-12'
                        : 'bg-gray-100 mr-12'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                        <div className="font-semibold mb-1">Tool Calls:</div>
                        {msg.toolCalls.map((call, idx) => (
                          <div key={idx} className="mb-1">
                            <span className="font-mono">{call.tool}</span>
                            {call.result && (
                              <div className="ml-2 text-gray-600">
                                → {JSON.stringify(call.result).substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedConv && (
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleLoadConversation(selectedConv.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Load Conversation
              </button>
              <button
                onClick={() => handleDeleteConversation(selectedConv.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};