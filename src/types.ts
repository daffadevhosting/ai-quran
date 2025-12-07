export interface Env {
  AI: any;
  NEURON_LIMITER: KVNamespace;  // KV untuk tracking neuron
  RATE_LIMITER: KVNamespace;    // KV untuk rate limiting
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIResponse {
  response?: string;
  content?: string;
  answer?: string;
  usage?: AIUsage;
  [key: string]: any;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface QuranVerse {
  id: number;
  text: string;
  translation: string;
}

export interface QuranSurah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: QuranVerse[];
}

export interface AIRequest {
  question: string;
  language?: string;
  context?: QuranVerse[];
}

export interface AIResponseOutput {
  success: boolean;
  answer: string;
  verses_data?: Array<{
    surah_id: number;
    surah_name: string;
    surah_name_arabic?: string;
    verse_id: number;
    verse_arabic: string;
    verse_translation: string;
    reference: string;
  }>;
  language?: string;
  timestamp: string;
  disclaimer?: string;
  usage?: {
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    neurons: {
      consumed: number;
      formatted: string;
      remaining: number;
      daily_limit: number;
    };
    cost_estimate: {
      input_usd: string;
      output_usd: string;
      total_usd: string;
    };
  };
  error?: string;
  limit_info?: {
    consumed: number;
    remaining: number;
    daily_limit: number;
    message?: string;
  };
}

export interface ChatContext {
  conversationId?: string;
  history?: ChatMessage[];
}

export interface NaturalChatRequest {
  messages: ChatMessage[];
  context?: ChatContext;
}
