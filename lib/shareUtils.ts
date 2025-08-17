import { CaseState, Feedback, ComprehensiveFeedback } from '../types';
import { ShareData } from '../types/share';

export const generateShareData = (
  feedback: Feedback | ComprehensiveFeedback,
  caseState: CaseState
): ShareData => {
  const diagnosis = feedback.diagnosis;
  const correctDiagnosis = caseState.caseDetails?.diagnosis || 'Unknown';
  const department = caseState.department?.name || 'Clinical Case';
  
  // Determine achievement text based on diagnosis accuracy
  const achievementText = diagnosis === correctDiagnosis 
    ? "Successfully diagnosed the case" 
    : "Completed a challenging clinical case";
  
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

// Generate share image using html2canvas
export const generateShareImage = async (shareData: ShareData): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        reject(new Error('Document not available - not in browser environment'));
        return;
      }

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1080px';
      container.style.height = '1350px';
      document.body.appendChild(container);

      // Import the ShareCard component dynamically
      import('../components/ShareCard').then(({ ShareCard }) => {
        // Create React element
        const React = require('react');
        const ReactDOM = require('react-dom');
        
        const shareCardElement = React.createElement(ShareCard, { shareData });
        
        // Render the component
        ReactDOM.render(shareCardElement, container);
        
        // Wait for rendering to complete
        setTimeout(() => {
          // Use html2canvas to capture the component
          import('html2canvas').then(({ default: html2canvas }) => {
            html2canvas(container, {
              width: 1080,
              height: 1350,
              scale: 2, // Higher quality
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            }).then(canvas => {
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          
              // Clean up
              document.body.removeChild(container);
          
          resolve(dataUrl);
            }).catch(error => {
              document.body.removeChild(container);
              reject(error);
            });
          }).catch(error => {
            document.body.removeChild(container);
            reject(new Error('html2canvas not available'));
          });
        }, 100);
      }).catch(error => {
        document.body.removeChild(container);
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
