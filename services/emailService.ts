import { DetailedFeedbackReport } from '../types';

/**
 * Email service that sends detailed feedback reports to students.
 * This client-side service makes a fetch request to our secure API endpoint
 * which handles the actual email sending via Resend.
 */

const createHtmlBody = (report: DetailedFeedbackReport): string => {
    // A simple but effective HTML email template
    // In a real app, you might use a templating library like `react-email`
    return `
        <h1>ClerkSmart Case Report</h1>
        <p><strong>Case Diagnosis:</strong> ${report.diagnosis}</p>
        <hr>
        <h2>Key Takeaway</h2>
        <p>${report.keyTakeaway}</p>
        <h2>What You Did Well</h2>
        <ul>${report.whatYouDidWell.map(p => `<li>${p}</li>`).join('')}</ul>
        <h2>Areas for Improvement</h2>
        <ul>${report.whatCouldBeImproved.map(p => `<li>${p}</li>`).join('')}</ul>
        <h2>In-depth Analysis</h2>
        <h3>Highlights from your conversation:</h3>
        ${report.positiveQuotes.map(q => `<blockquote>"${q.quote}"<br><small><strong>Analysis:</strong> ${q.explanation}</small></blockquote>`).join('')}
        <h3>Learning opportunities from your conversation:</h3>
        ${report.improvementQuotes.map(q => `<blockquote>"${q.quote}"<br><small><strong>Analysis:</strong> ${q.explanation}</small></blockquote>`).join('')}
        <h2>Clinical Tip</h2>
        <p>${report.clinicalTip}</p>
    `;
};

export const sendFeedbackEmail = async (report: DetailedFeedbackReport, recipientEmail: string): Promise<{ success: boolean }> => {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ report, recipientEmail }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error sending email:', data.error);
            return { success: false };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error in sendFeedbackEmail:', error);
        return { success: false };
    }
};
