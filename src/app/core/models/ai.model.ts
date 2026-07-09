export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  textEn: string;
  textAr: string;
  timestamp: Date;
}
