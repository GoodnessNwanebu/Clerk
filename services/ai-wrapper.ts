// This is a wrapper around the Google Generative AI library to provide proper typing
// and a consistent interface for the rest of the application

// Importing the actual library - TypeScript will use our type declarations
import { GoogleGenerativeAI } from '@google/generative-ai';

export function createAIClient(apiKey: string) {
  // Clean the API key in case it has a "key=" prefix
  const cleanApiKey = apiKey.trim().replace(/^key=/, '');
  console.log(`API Key length: ${cleanApiKey.length}, First 4 chars: ${cleanApiKey.substring(0, 4)}...`);
  
  const genAI = new GoogleGenerativeAI(cleanApiKey);
  
  // Add the generateContent method directly to match Google's example
  return {
    generateContent: async ({ model, contents }) => {
      const genModel = genAI.getGenerativeModel({ model });
      const response = await genModel.generateContent(contents);
      const result = await response.response;
      return {
        text: result.text(),
      };
    },
    getGenerativeModel: genAI.getGenerativeModel.bind(genAI)
  };
}

export type AIClient = ReturnType<typeof createAIClient>;

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

export interface GenerateContentOptions {
  model: string;
  contents: any;
  config?: {
    responseMimeType?: string;
    temperature?: number;
    systemInstruction?: string;
    thinkingConfig?: { thinkingBudget: number };
  };
}

// Re-export types that we want to use throughout the application
export { GoogleGenerativeAI }; 