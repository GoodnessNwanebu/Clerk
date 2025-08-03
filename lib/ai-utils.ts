import { NextResponse } from 'next/server';
import { createAIClient } from '../services/ai-wrapper';

// Ensure the API key is available in the server environment
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set for the serverless function.");
}

export const ai = createAIClient(process.env.GEMINI_API_KEY);
export const MODEL = 'gemini-2.5-flash';

// Medical education pathophysiology buckets
export const MEDICAL_BUCKETS = [
    'Vascular',
    'Infectious/Inflammatory',
    'Neoplastic',
    'Degenerative',
    'Idiopathic/Iatrogenic/Inherited',
    'Congenital',
    'Autoimmune',
    'Trauma/Mechanical',
    'Endocrine/Metabolic',
    'Psychiatric/Functional'
];

// Optimized location contexts (cached)
export const LOCATION_CONTEXTS: { [key: string]: string } = {
    'United States': 'Diverse multicultural society, insurance-based healthcare',
    'United Kingdom': 'NHS universal healthcare, British cultural norms',
    'Canada': 'Multicultural society, universal healthcare, cold climate',
    'Australia': 'Multicultural society, Medicare system, sun exposure risks',
    'India': 'Diverse regional cultures, tropical climate, family-oriented',
    'Nigeria': 'Diverse ethnic groups, tropical diseases, mixed healthcare approaches',
    'Germany': 'Universal healthcare, strong social support, temperate climate',
    'France': 'Social healthcare system, Mediterranean influences',
    'Japan': 'Aging population, respectful cultural norms, modern lifestyle',
    'Brazil': 'Diverse cultural heritage, tropical climate, socioeconomic diversity'
};

// --- Helper to safely parse JSON from Gemini response ---
export const parseJsonResponse = <T>(text: string, context: string): T => {
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    // Remove any leading/trailing non-JSON text
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }
    
    // Additional cleanup for common AI response artifacts
    jsonStr = jsonStr.replace(/^[^{]*/, ''); // Remove anything before first {
    jsonStr = jsonStr.replace(/}[^}]*$/, '}'); // Remove anything after last }
    
    try {
        const parsedData = JSON.parse(jsonStr);
        
        // Validate that we got an object
        if (typeof parsedData !== 'object' || parsedData === null) {
            throw new Error('Response is not a valid JSON object');
        }
        
        return parsedData as T;
    } catch (e) {
        console.error(`Failed to parse JSON response for ${context}:`, e);
        console.error("Raw text from AI:", text);
        console.error("Attempted to parse:", jsonStr);
        
        // Try one more time with more aggressive cleaning
        try {
            // Remove all newlines and extra spaces that might break JSON
            const cleanedJson = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            const parsedData = JSON.parse(cleanedJson);
            
            if (typeof parsedData !== 'object' || parsedData === null) {
                throw new Error('Response is not a valid JSON object');
            }
            
            return parsedData as T;
        } catch (secondError) {
            console.error("Second parsing attempt failed:", secondError);
            
            // Provide more specific error messages
            if (e instanceof SyntaxError) {
                throw new Error(`The AI returned malformed JSON for ${context}. Please try again.`);
            }
            
            throw new Error(`The AI returned an invalid format for ${context}. Please try again.`);
        }
    }
};

export const handleApiError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
        // Handle quota exceeded errors
        if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
            return NextResponse.json({ error: 'QUOTA_EXCEEDED: You have exceeded your daily quota. Please try again tomorrow.' }, { status: 429 });
        }
        
        // Handle API key errors
        if (error.message.includes('API key') || error.message.includes('authentication') || error.message.includes('403')) {
            return NextResponse.json({ error: 'API authentication failed. Please check your API key configuration.' }, { status: 401 });
        }
        
        // Handle rate limiting
        if (error.message.includes('rate limit') || error.message.includes('429')) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment and try again.' }, { status: 429 });
        }
        
        // Handle network/connection errors
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')) {
            return NextResponse.json({ error: 'Network error. Please check your internet connection and try again.' }, { status: 503 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
}; 