// Direct API wrapper using fetch instead of the problematic GoogleGenerativeAI library
// This bypasses library issues and uses the proven working API endpoint

export function createAIClient(apiKey: string) {
  // Clean the API key in case it has a "key=" prefix
  const cleanApiKey = apiKey.trim().replace(/^key=/, '');
  console.log(`API Key length: ${cleanApiKey.length}, First 4 chars: ${cleanApiKey.substring(0, 4)}...`);
  
  return {
    generateContent: async ({ model, contents, config }: GenerateContentOptions): Promise<{ text: string }> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanApiKey}`;
      
      // Convert contents to the correct Google API format
      let formattedContents;
      if (Array.isArray(contents)) {
        // Convert [{ text: "message" }] to [{ parts: [{ text: "message" }] }]
        formattedContents = contents.map(content => ({
          parts: [{ text: content.text }]
        }));
      } else {
        // Handle single content object
        formattedContents = [{ parts: [{ text: contents.text }] }];
      }

      const requestBody = {
        contents: formattedContents,
        ...(config?.temperature && {
          generationConfig: {
            temperature: config.temperature,
          }
        })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      // Extract text from the response structure
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return { text };
    }
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

// Note: We're using direct fetch API calls instead of the GoogleGenerativeAI library
// for better reliability and to avoid library-specific issues 