import { ConsultantTeachingNotes } from '../types';

/**
 * Email service that sends clinical teaching notes to students.
 * This client-side service makes a fetch request to our secure API endpoint
 * which handles the actual email sending via Resend.
 */

const createHtmlBody = (notes: ConsultantTeachingNotes): string => {
    return `
        <h1>ClerkSmart Clinical Teaching Notes</h1>
        <p><strong>Case Diagnosis:</strong> ${notes.diagnosis}</p>
        <hr>
        <h2>Key Learning Point</h2>
        <p>${notes.keyLearningPoint}</p>
        <h2>Clerking Structure</h2>
        <p>${notes.clerkingStructure}</p>
        <h2>Missed Opportunities</h2>
        ${notes.missedOpportunities.map(item => `
            <div style="margin-bottom: 15px;">
                <strong>${item.opportunity}</strong><br>
                <em>Clinical significance:</em> ${item.clinicalSignificance}
            </div>
        `).join('')}
        <h2>Clinical Reasoning</h2>
        <p>${notes.clinicalReasoning}</p>
        <h2>Communication</h2>
        <p>${notes.communicationNotes}</p>
        <h2>Clinical Pearls</h2>
        <ul>${notes.clinicalPearls.map(pearl => `<li>${pearl}</li>`).join('')}</ul>
    `;
};

export const sendFeedbackEmail = async (notes: ConsultantTeachingNotes, recipientEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Ensure we have a proper base URL for server-side calls
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
        const url = `${baseUrl}/api/send-email`;
        
        console.log(`Making email API call to: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report: notes, recipientEmail }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error sending email:', data.error);
            return { success: false, error: data.error || 'Failed to send email' };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error in sendFeedbackEmail:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Network error occurred' };
    }
};
