import { NextRequest, NextResponse } from 'next/server';
import { createOrGetUser, addMessage, saveExaminationResults, saveInvestigationResults, saveFeedback, saveDetailedFeedback } from '../../../lib/database/database';

// --- Main Router Handler ---
export async function POST(request: NextRequest) {
    try {
        // Validate request method
        if (request.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }
        
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        
        // Validate request body structure
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
        }

        const { type, payload, userEmail, userCountry, caseId } = body;

        // Validate type
        if (!type || typeof type !== 'string') {
            return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
        }

        // Validate payload
        if (!payload || typeof payload !== 'object') {
            return NextResponse.json({ error: 'Request payload is required' }, { status: 400 });
        }

        // Create or get user if email is provided
        let user = null;
        if (userEmail) {
            user = await createOrGetUser(userEmail, userCountry);
        }

        // List of valid request types
        const validTypes = [
            'generateCase',
            'getPatientResponse',
            'getInvestigationResults',
            'getExaminationResults',
            'getFeedback',
            'getDetailedFeedback',
            'getComprehensiveFeedback',
            'generatePatientProfile',
            'addStudentMessage'
        ];

        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: `Invalid request type: ${type}` }, { status: 400 });
        }

        console.log(`Processing ${type} request`);

        // Route to appropriate modularized handler
        let response: Response | null = null;
        switch (type) {
            case 'addStudentMessage':
                // For student messages, we don't need to call another API
                // Just return success and let the database storage handle it
                response = null;
                break;
            case 'generateCase':
                response = await fetch(`${request.nextUrl.origin}/api/ai/generate-case`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'getPatientResponse':
                response = await fetch(`${request.nextUrl.origin}/api/ai/patient-response`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'getInvestigationResults':
                response = await fetch(`${request.nextUrl.origin}/api/ai/investigation-results`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'getExaminationResults':
                response = await fetch(`${request.nextUrl.origin}/api/ai/examination-results`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'getFeedback':
                response = await fetch(`${request.nextUrl.origin}/api/ai/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'getDetailedFeedback':
                response = await fetch(`${request.nextUrl.origin}/api/ai/detailed-feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            
            case 'getComprehensiveFeedback':
                response = await fetch(`${request.nextUrl.origin}/api/ai/comprehensive-feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            case 'generatePatientProfile':
                response = await fetch(`${request.nextUrl.origin}/api/ai/patient-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                break;
            default:
                return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
        }

        // Handle response data
        let responseData;
        if (type === 'addStudentMessage') {
            responseData = { success: true };
        } else if (response) {
            responseData = await response.json();
        } else {
            return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
        }

        // Store relevant data in database if user and caseId are provided
        if (user && caseId) {
            try {
                switch (type) {
                    case 'addStudentMessage':
                        // Store student message
                        if (payload.text && payload.sender === 'student') {
                            await addMessage({
                                sender: payload.sender,
                                text: payload.text,
                                speakerLabel: payload.speakerLabel,
                                caseId: caseId
                            });
                        }
                        break;
                    case 'getPatientResponse':
                        // Store patient response as a message
                        if (responseData.messages && Array.isArray(responseData.messages)) {
                            for (const message of responseData.messages) {
                                await addMessage({
                                    sender: message.sender,
                                    text: message.response,
                                    speakerLabel: message.speakerLabel,
                                    caseId: caseId
                                });
                            }
                        }
                        break;
                    case 'getExaminationResults':
                        // Store examination results
                        if (responseData.results && Array.isArray(responseData.results)) {
                            await saveExaminationResults(caseId, responseData.results);
                        }
                        break;
                    case 'getInvestigationResults':
                        // Store investigation results
                        if (responseData.results && Array.isArray(responseData.results)) {
                            await saveInvestigationResults(caseId, responseData.results);
                        }
                        break;
                    case 'getFeedback':
                        // Store feedback
                        if (responseData) {
                            await saveFeedback(caseId, responseData);
                        }
                        break;
                    case 'getDetailedFeedback':
                        // Store detailed feedback
                        if (responseData) {
                            await saveDetailedFeedback(caseId, responseData);
                        }
                        break;
                }
            } catch (dbError) {
                console.error('Database storage error:', dbError);
                // Don't fail the request if database storage fails
            }
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Unhandled error in POST handler:', error);
        
        // If it's already a NextResponse, return it
        if (error instanceof Response) {
            return error;
        }
        
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
} 