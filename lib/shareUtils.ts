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

// Note: Image generation is now handled in ShareModal component using pre-render approach

// Share on WhatsApp with image
export const shareOnWhatsAppWithImage = async (shareData: ShareData) => {
  try {
    // For now, just share text since image generation is handled in the modal
    shareOnWhatsApp(shareData);
  } catch (error) {
    console.error('Error sharing:', error);
    // Final fallback to text-only sharing
    shareOnWhatsApp(shareData);
  }
};

// Note: Download functionality can be added back if needed in the future
