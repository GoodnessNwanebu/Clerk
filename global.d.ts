// Add declaration for Google Generative AI library
declare module '@google/generative-ai' {
  export interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseType?: string;
    responseFormat?: string;
    candidateCount?: number;
  }
  
  export interface ChatSession {
    sendMessage: (message: string) => Promise<{
      response: {
        text: () => string;
      }
    }>;
  }
  
  export interface GenerativeModel {
    generateContent: (content: string | object) => Promise<{
      response: {
        text: () => string;
      }
    }>;
    startChat: (options?: {
      history?: Array<{role: string, parts: Array<{text: string}>}>,
      systemInstruction?: string,
      generationConfig?: GenerationConfig
    }) => ChatSession;
  }

  export class GoogleGenerativeAI {
    constructor(options: { apiKey: string });
    
    getGenerativeModel: (options: { model: string }) => GenerativeModel;
  }
} 

declare module 'next-pwa' {
  import { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
  }
  
  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
} 