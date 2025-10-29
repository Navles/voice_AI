
export type Speaker = 'user' | 'model';

export interface TranscriptMessage {
  id: string;
  speaker: Speaker;
  text: string;
  isFinal: boolean;
}

export type ConversationStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
