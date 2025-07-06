import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ClerkReportEmail from '../../emails/ClerkReportEmail';
import { DetailedFeedbackReport } from '../../types';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { report, recipientEmail } = req.body;

    if (!report || !recipientEmail) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Render the React email template to HTML
    const emailHtml = render(ClerkReportEmail({ report }));

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'ClerkSmart <onboarding@resend.dev>', // Use verified domain in production
      to: recipientEmail,
      subject: `Your ClerkSmart Case Report: ${report.diagnosis}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
} 