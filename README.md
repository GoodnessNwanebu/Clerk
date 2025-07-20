# ClerkSmart - Intelligent Clinical Reasoning Simulator

ClerkSmart is an advanced medical education platform that provides realistic clinical reasoning simulations for medical students. The platform offers interactive patient encounters with AI-powered responses, comprehensive feedback, and location-specific cultural context.

## Features

### 🏥 **Available Departments**
- **Obstetrics**: Care during pregnancy, childbirth, and postpartum
- **Gynecology**: Health of the female reproductive system  
- **Pediatrics**: Medical care of infants, children, and adolescents
- **General Surgery**: Surgical treatment of various conditions and injuries
- **Cardiothoracic Surgery**: Surgery of the heart, lungs, and chest cavity

### 🎯 **Core Features**
- **Interactive Patient Encounters**: Real-time conversation with AI patients
- **Voice Recognition**: Natural speech-to-text for hands-free interaction
- **Location-Specific Context**: Culturally relevant cases based on user location
- **Comprehensive Feedback**: Detailed performance analysis and learning points
- **Practice Mode**: Target specific conditions for focused learning
- **Investigation Results**: Realistic lab values, imaging, and pathology reports
- **Email Reports**: Detailed feedback sent directly to your email

### 🌍 **Global Context**
The platform adapts to your location, providing:
- Culturally appropriate patient names and contexts
- Region-specific healthcare system references
- Local environmental and lifestyle factors
- Appropriate medical terminology and communication styles

## Technical Implementation

### AI Integration
- **Gemini 2.5 Flash**: Advanced AI model for realistic patient responses
- **Surgical Context**: Specialized prompts for surgical departments
- **Pediatric Support**: Age-appropriate interactions and parent involvement
- **Location Anchoring**: Consistent cultural context throughout conversations

### PWA Features
- **Native App Feel**: Full-screen experience with no browser scrollbars
- **iOS Optimization**: Specialized meta tags and CSS for iOS devices
- **Offline Capability**: Service worker for offline functionality
- **Responsive Design**: Optimized for all device sizes

### Email Integration
We've implemented email functionality using [Resend](https://resend.com), a modern email API that works seamlessly with React and Next.js.

#### Key Components
1. **React Email Template**: Beautiful, responsive email template using React Email components
2. **Next.js API Route**: Serverless function that securely handles email sending with Resend
3. **Email Service**: Client-side service that communicates with the API route
4. **Email Capture Modal**: User interface for collecting email addresses

## Setup Instructions

For detailed email setup instructions, see [RESEND_SETUP.md](./RESEND_SETUP.md).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### For Students
1. **Choose a Department**: Select from Obstetrics, Gynecology, Pediatrics, General Surgery, or Cardiothoracic Surgery
2. **Start a Case**: Begin with a random case or use Practice Mode for specific conditions
3. **Interview the Patient**: Use voice or text to ask questions naturally
4. **Order Investigations**: Request relevant tests and interpret results
5. **Formulate Diagnosis**: Develop your clinical reasoning
6. **Receive Feedback**: Get comprehensive performance analysis
7. **Email Report**: Receive detailed feedback via email

### For Educators
- **Practice Mode**: Create targeted cases for specific learning objectives
- **Location Context**: Cases adapt to different cultural and healthcare contexts
- **Comprehensive Feedback**: Detailed analysis of student performance
- **Clinical Pearls**: Educational insights and teaching points

## Technical Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **AI**: Google Gemini 2.5 Flash API
- **Email**: Resend API with React Email
- **PWA**: Service Worker, Web App Manifest
- **Styling**: Tailwind CSS with custom design system

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
