import { CaseState, Feedback, ComprehensiveFeedback } from '../../types';
import { ShareData } from '../../types/share';

export const generateShareData = (
  feedback: Feedback | ComprehensiveFeedback,
  caseState: CaseState
): ShareData => {
  const diagnosis = feedback.diagnosis;
  const correctDiagnosis = caseState.caseDetails?.diagnosis || 'Unknown';
  const department = caseState.department || 'Clinical Case';
  
  // Determine achievement text based on diagnosis accuracy
  const achievementText = diagnosis === correctDiagnosis 
    ? "Successfully diagnosed the case" 
    : "Completed a challenging clinical case";
  
  // Generate the share message
  const shareMessage = `${achievementText}

Correctly diagnosed: ${diagnosis} !

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

// Share on WhatsApp with image
export const shareOnWhatsAppWithImage = async (shareData: ShareData, imageDataUrl?: string | null) => {
  try {
    if (imageDataUrl) {
      // Try to share image using Web Share API if available
      if (navigator.share && navigator.canShare) {
        // Convert data URL to blob for sharing
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        
        const sharePayload = {
          title: 'My ClerkSmart Achievement',
          text: shareData.shareMessage,
          files: [new File([blob], 'achievement.png', { type: 'image/png' })]
        };
        
        if (navigator.canShare(sharePayload)) {
          await navigator.share(sharePayload);
          return;
        }
      }
      
      // Fallback: Download image and share text
      const link = document.createElement('a');
      link.download = 'clerk-smart-achievement.png';
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Share text message after a brief delay
      setTimeout(() => {
        shareOnWhatsApp(shareData);
      }, 500);
    } else {
      // No image available, just share text
      shareOnWhatsApp(shareData);
    }
  } catch (error) {
    console.error('Error sharing:', error);
    // Final fallback to text-only sharing
    shareOnWhatsApp(shareData);
  }
};

// Note: Download functionality can be added back if needed in the future
