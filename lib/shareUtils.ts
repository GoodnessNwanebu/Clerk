import { CaseState, Feedback, ComprehensiveFeedback } from '../types';

export interface ShareData {
  diagnosis: string;
  correctDiagnosis: string;
  department: string;
  achievementText: string;
  shareMessage: string;
}

export const generateShareData = (
  feedback: Feedback | ComprehensiveFeedback,
  caseState: CaseState
): ShareData => {
  const diagnosis = feedback.diagnosis;
  const correctDiagnosis = caseState.caseDetails?.diagnosis || 'Unknown';
  const department = caseState.department?.name || 'Clinical Case';
  
  // Determine achievement text based on diagnosis accuracy
  const achievementText = diagnosis === correctDiagnosis 
    ? "I cracked the case." 
    : "Just tackled this challenging case.";
  
  // Generate the share message
  const shareMessage = `${achievementText}

Correctly diagnosed: ${diagnosis}

In the top 2% of ClerkSmart users this week

Come try a patient on ClerkSmart: https://clerksmart.vercel.app`;
  
  return {
    diagnosis,
    correctDiagnosis,
    department,
    achievementText,
    shareMessage
  };
};

export const shareOnWhatsApp = (shareData: ShareData) => {
  const message = encodeURIComponent(shareData.shareMessage);
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

// Generate a beautiful share image using Canvas
export const generateShareImage = async (shareData: ShareData): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas with higher pixel density for crisp images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
  
        // Set canvas size (3000x4500 for optimal portrait sharing)
        // Using devicePixelRatio for higher definition
        const devicePixelRatio = window.devicePixelRatio || 1;
        const baseWidth = 3000;
        const baseHeight = 4500;
        
        canvas.width = baseWidth * devicePixelRatio;
        canvas.height = baseHeight * devicePixelRatio;
        
        // Scale the context to ensure crisp rendering
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        // Set the canvas CSS size to the base dimensions
        canvas.style.width = baseWidth + 'px';
        canvas.style.height = baseHeight + 'px';
  
        // Load Inter font if available
        const loadFont = async () => {
          try {
            if ('fonts' in document) {
              await (document as any).fonts.load('bold 120px Inter, sans-serif');
              await (document as any).fonts.load('bold 90px Inter, sans-serif');
              await (document as any).fonts.load('60px Inter, sans-serif');
              await (document as any).fonts.load('bold 70px Inter, sans-serif');
              await (document as any).fonts.load('bold 50px Inter, sans-serif');
              await (document as any).fonts.load('45px Inter, sans-serif');
              await (document as any).fonts.load('bold 55px Inter, sans-serif');
            }
          } catch (error) {
            console.warn('Font loading failed, using fallback fonts:', error);
          }
        };
  
        // Generate the image after font loading
        loadFont().then(() => {
          // Create gradient background
          const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
          gradient.addColorStop(0, '#0f172a'); // slate-900
          gradient.addColorStop(1, '#1e293b'); // slate-800
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, baseWidth, baseHeight);
  
          // Add subtle pattern overlay
          ctx.fillStyle = 'rgba(20, 184, 166, 0.05)'; // teal-500 with low opacity
          for (let i = 0; i < baseWidth; i += 100) {
            for (let j = 0; j < baseHeight; j += 100) {
              ctx.fillRect(i, j, 5, 5);
            }
          }
  
          // Draw main content area
          const contentWidth = baseWidth - 200;
          const contentHeight = baseHeight - 200;
          const contentX = 100;
          const contentY = 100;
  
          // Content background with rounded corners effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 50;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 25;
          ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
  
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
  
          // Draw ClerkSmart logo/branding
          ctx.fillStyle = '#14b8a6'; // teal-500
          ctx.font = 'bold 120px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ClerkSmart', baseWidth / 2, contentY + 200);
  
          // Draw achievement text
          ctx.fillStyle = '#0f172a'; // slate-900
          ctx.font = 'bold 90px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shareData.achievementText, baseWidth / 2, contentY + 400);
  
          // Draw diagnosis
          ctx.fillStyle = '#475569'; // slate-600
          ctx.font = '60px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Correctly diagnosed:', baseWidth / 2, contentY + 550);
  
          // Draw diagnosis value with highlight
          ctx.fillStyle = '#14b8a6'; // teal-500
          ctx.font = 'bold 70px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shareData.diagnosis, baseWidth / 2, contentY + 650);
  
          // Draw achievement badge
          ctx.fillStyle = '#f59e0b'; // amber-500
          ctx.font = 'bold 50px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 In the top 2% of ClerkSmart users this week', baseWidth / 2, contentY + 800);
  
          // Draw decorative elements
          ctx.strokeStyle = '#14b8a6';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(contentX + 150, contentY + 950);
          ctx.lineTo(contentX + contentWidth - 150, contentY + 950);
          ctx.stroke();
  
          // Draw department info
          ctx.fillStyle = '#64748b'; // slate-500
          ctx.font = '45px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(shareData.department, baseWidth / 2, contentY + 1050);
  
          // Draw call to action
          ctx.fillStyle = '#14b8a6'; // teal-500
          ctx.font = 'bold 55px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Practice clinical reasoning with AI-powered cases', baseWidth / 2, contentY + 1150);
  
          // Convert to data URL with maximum quality
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          resolve(dataUrl);
        }).catch((error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  };

// Share on WhatsApp with image
export const shareOnWhatsAppWithImage = async (shareData: ShareData) => {
  try {
    // Generate the image
    const imageDataUrl = await generateShareImage(shareData);
    
    // Try to use Web Share API with files (for mobile devices)
    if (navigator.share && navigator.canShare) {
      try {
        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        // Create file from blob
        const file = new File([blob], 'clerksmart-achievement.png', { type: 'image/png' });
        
        // Check if we can share files
        const shareData = {
          title: 'My ClerkSmart Achievement',
          text: 'Come try a patient on ClerkSmart: https://clerksmart.vercel.app',
          files: [file]
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return imageDataUrl;
        }
      } catch (error) {
        console.log('Web Share API with files not supported, falling back to download');
      }
    }
    
    // Fallback: Download the image and share text
    await downloadImage(imageDataUrl, 'clerksmart-achievement.png');
    
    // Share text with WhatsApp
    const message = encodeURIComponent(`Come try a patient on ClerkSmart: https://clerksmart.vercel.app`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    return imageDataUrl;
  } catch (error) {
    console.error('Error sharing image:', error);
    // Final fallback to text-only sharing
    shareOnWhatsApp(shareData);
  }
};

// Helper function to download image
const downloadImage = (dataUrl: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};