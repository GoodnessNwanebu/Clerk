import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ClerkReportEmail from '../../../emails/ClerkReportEmail';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Validate API key first
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json({ 
        error: 'Email service is not configured. Please contact support.' 
      }, { status: 500 });
    }

    const { report, recipientEmail } = await request.json();

    console.log('Attempting to send email with Resend API');
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('API Key length:', process.env.RESEND_API_KEY?.length);
    console.log('From email:', process.env.FROM_EMAIL || 'ClerkSmart <onboarding@resend.dev>');
    console.log('To email:', recipientEmail);
    console.log('Report data:', JSON.stringify(report, null, 2));

    if (!report || !recipientEmail) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Render the React email template to HTML
    // @ts-expect-error - React email render compatibility issue
    const emailHtml = await render(ClerkReportEmail({ report }));

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'ClerkSmart <onboarding@resend.dev>', // Use verified domain in production
      to: recipientEmail,
      subject: `Your ClerkSmart Case Report: ${report.diagnosis}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: error.message || 'Failed to send email. Please try again.' 
      }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
} 