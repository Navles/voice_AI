/**
 * Conversation History Service
 * File: services/conversationHistory.ts
 */

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    args: Record<string, any>;
    result?: any;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class ConversationHistoryService {
  private conversations: Map<string, Conversation> = new Map();
  private currentConversationId: string | null = null;
  private storageKey = 'gemini_conversations';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((conv: any) => {
          this.conversations.set(conv.id, {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          });
        });
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.conversations.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  createConversation(title?: string): string {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: Conversation = {
      id,
      title: title || `Conversation ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(id, conversation);
    this.currentConversationId = id;
    this.saveToStorage();
    return id;
  }

  addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    toolCalls?: Array<{ tool: string; args: Record<string, any>; result?: any }>
  ): ConversationMessage {
    if (!this.currentConversationId) {
      this.createConversation();
    }

    const conversation = this.conversations.get(this.currentConversationId!);
    if (!conversation) {
      throw new Error('Current conversation not found');
    }

    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      toolCalls,
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Auto-generate title from first user message
    if (conversation.messages.length === 1 && role === 'user') {
      conversation.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    this.saveToStorage();
    return message;
  }

  getCurrentConversation(): Conversation | null {
    if (!this.currentConversationId) return null;
    return this.conversations.get(this.currentConversationId) || null;
  }

  getConversation(id: string): Conversation | null {
    return this.conversations.get(id) || null;
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  setCurrentConversation(id: string) {
    if (this.conversations.has(id)) {
      this.currentConversationId = id;
    }
  }

  deleteConversation(id: string) {
    this.conversations.delete(id);
    if (this.currentConversationId === id) {
      this.currentConversationId = null;
    }
    this.saveToStorage();
  }

  clearAllConversations() {
    this.conversations.clear();
    this.currentConversationId = null;
    localStorage.removeItem(this.storageKey);
  }

  exportConversation(id: string): string {
    const conversation = this.conversations.get(id);
    if (!conversation) return '';

    return JSON.stringify(conversation, null, 2);
  }
}

export const conversationHistory = new ConversationHistoryService();