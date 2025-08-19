# Setting Up Resend Email Integration for ClerkSmart

This document provides instructions for setting up the Resend email integration for sending detailed clerk reports in ClerkSmart.

## Overview

ClerkSmart now uses [Resend](https://resend.com) to send detailed clerk reports to students via email. This integration allows students to receive comprehensive feedback on their clinical performance that they can review later.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [Resend.com](https://resend.com) and sign up for an account
2. Verify your email address to activate your account

### 2. Verify Your Domain (Recommended for Production)

For production use, you should verify a domain to send emails from:

1. In the Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Follow the instructions to add DNS records to your domain
4. Wait for domain verification to complete

### 3. Create an API Key

1. In the Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name your API key (e.g., "ClerkSmart Production")
4. Copy the API key (you'll only see it once)

### 4. Configure Environment Variables

Add these environment variables to your deployment:

```
# Resend API key
RESEND_API_KEY=your_resend_api_key_here

# Verified sender email (must be from your verified domain)
FROM_EMAIL=noreply@yourdomain.com
```

For local development, create a `.env.local` file in the root of your project with these variables.

### 5. Testing the Integration

1. Start your development server
2. Go to the feedback page after completing a case
3. Click "Email Me the Full Report" and enter your email
4. Check your inbox for the detailed report

## Troubleshooting

If emails are not being sent:

1. Check the console logs for error messages
2. Verify that your API key is correct
3. Ensure your sender email is from a verified domain
4. Check Resend dashboard for failed deliveries

## Development vs. Production

- **Development**: You can use the `onboarding@resend.dev` email address for testing
- **Production**: Use an email address from your verified domain

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction) 