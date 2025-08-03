import { NextRequest, NextResponse } from 'next/server';
import { Case, DifficultyLevel } from '../../../../types';
import { getTimeContext } from '../../../../utils/timeContext';
import { ai, MODEL, MEDICAL_BUCKETS, parseJsonResponse, handleApiError } from '../../../../lib/ai-utils';
import { 
    generateCasePrompt, 
    getDifficultyPrompt, 
    getLocationPrompt, 
    getSurgicalPrompt, 
    getPediatricPrompt 
} from '../../../../lib/prompts/case-generation';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { departmentName, difficulty = 'standard', userCountry } = body;
        
        if (!departmentName) {
            return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
        }

        const context = 'generateClinicalCase';
        
        // Get time context for the user's location
        const timeContext = getTimeContext(userCountry);
        
        // Check if this is a pediatric case
        const isPediatric = departmentName.toLowerCase().includes('pediatric') || departmentName.toLowerCase().includes('paediatric');
        
        // Check if this is a surgical department
        const isSurgical = departmentName.toLowerCase().includes('surgery') || departmentName.toLowerCase().includes('surgical');
        const isCardiothoracic = departmentName.toLowerCase().includes('cardiothoracic') || departmentName.toLowerCase().includes('cardiac');
        const isGeneralSurgery = departmentName.toLowerCase().includes('general surgery');
        
        // Randomly select a medical bucket
        const randomBucket = MEDICAL_BUCKETS[Math.floor(Math.random() * MEDICAL_BUCKETS.length)];
        
        // Get optimized prompts
        const locationPrompt = getLocationPrompt(userCountry);
        const surgicalPrompt = getSurgicalPrompt(isSurgical, isCardiothoracic, isGeneralSurgery);
        const pediatricPrompt = getPediatricPrompt(isPediatric);
        const difficultyPrompt = getDifficultyPrompt(difficulty);
        
        const userMessage = generateCasePrompt(
            departmentName, 
            randomBucket, 
            timeContext.formattedContext, 
            locationPrompt, 
            surgicalPrompt, 
            pediatricPrompt, 
            isPediatric, 
            isSurgical
        ) + (difficultyPrompt ? `\n\n${difficultyPrompt}` : '');

        const response = await ai.generateContent({
            model: MODEL,
            contents: [{ text: userMessage }],
        });
        
        const caseJson = parseJsonResponse<Case>(response.text, context);
        return NextResponse.json(caseJson);
    } catch (error) {
        return handleApiError(error, 'generateCase');
    }
} 