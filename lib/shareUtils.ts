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
    ? "I cracked the case!" 
    : "Just tackled this challenging case!";
  
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
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        reject(new Error('Document not available - not in browser environment'));
        return;
      }

      // Create canvas with clean dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Clean dimensions for the new design
      const baseWidth = 1080;
      const baseHeight = 1350;
      
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      
      // Clean 1:1 pixel mapping
      canvas.style.width = baseWidth + 'px';
      canvas.style.height = baseHeight + 'px';

      console.log('Canvas setup:', {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height
      });

      // Test canvas functionality first
      try {
        // Draw a test rectangle to verify canvas works
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        const testDataUrl = canvas.toDataURL('image/png', 0.1);
        if (!testDataUrl || testDataUrl === 'data:,') {
          throw new Error('Canvas toDataURL test failed');
        }
        console.log('Canvas test successful');
        // Clear the test rectangle
        ctx.clearRect(0, 0, baseWidth, baseHeight);
      } catch (testError) {
        console.error('Canvas test failed:', testError);
        reject(new Error(`Canvas test failed: ${testError}`));
        return;
      }

      // Load fonts for the clean design
      const loadFont = async () => {
        try {
          if ('fonts' in document) {
            await (document as any).fonts.load('bold 80px Inter, sans-serif');   // Main headline
            await (document as any).fonts.load('bold 56px Inter, sans-serif');   // Diagnosis
            await (document as any).fonts.load('28px Inter, sans-serif');        // Labels and body text
            await (document as any).fonts.load('bold 36px Inter, sans-serif');   // Button text
            console.log('All fonts loaded successfully');
          } else {
            console.log('Font API not available, using fallback');
          }
        } catch (error) {
          console.warn('Font loading failed:', error);
        }
      };

      // Generate the image after font loading
      loadFont().then(() => {
        try {
          // Clean white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, baseWidth, baseHeight);

          // SECTION 1: MAIN HEADLINE WITH STETHOSCOPE ICON
          const section1Y = 180;
          
          // Draw stethoscope icon using SVG path (simplified Heroicons style)
          ctx.fillStyle = '#14b8a6'; // Teal color
          ctx.strokeStyle = '#14b8a6';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Stethoscope earpieces (larger and better positioned)
          ctx.beginPath();
          ctx.arc(baseWidth / 2 + 220, section1Y - 25, 18, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(baseWidth / 2 + 220, section1Y + 25, 18, 0, 2 * Math.PI);
          ctx.fill();
          
          // Stethoscope tubing (smoother curves)
          ctx.beginPath();
          ctx.moveTo(baseWidth / 2 + 220, section1Y - 25);
          ctx.quadraticCurveTo(baseWidth / 2 + 160, section1Y - 50, baseWidth / 2 + 100, section1Y - 35);
          ctx.quadraticCurveTo(baseWidth / 2 + 40, section1Y - 20, baseWidth / 2, section1Y);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(baseWidth / 2 + 220, section1Y + 25);
          ctx.quadraticCurveTo(baseWidth / 2 + 160, section1Y + 50, baseWidth / 2 + 100, section1Y + 35);
          ctx.quadraticCurveTo(baseWidth / 2 + 40, section1Y + 20, baseWidth / 2, section1Y);
          ctx.stroke();
          
          // Stethoscope chest piece (larger)
          ctx.beginPath();
          ctx.arc(baseWidth / 2, section1Y, 30, 0, 2 * Math.PI);
          ctx.fill();

          // Main headline text (positioned to the left of stethoscope)
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 80px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('I cracked the case.', baseWidth / 2 - 120, section1Y + 30);

          // SECTION 2: DIAGNOSIS SECTION
          const section2Y = 380;
          
          // Diagnosis label
          ctx.fillStyle = '#000000';
          ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Correctly diagnosed:', baseWidth / 2, section2Y);

          // Diagnosis value
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 56px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          
          // Multi-line text wrapping for long diagnoses
          const maxWidth = 900;
          const lineHeight = 70;
          
          const wrapText = (text: string, maxWidth: number): string[] => {
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            for (let i = 0; i < words.length; i++) {
              const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine) {
              lines.push(currentLine);
            }
            
            return lines;
          };
          
          const diagnosisLines = wrapText(shareData.diagnosis, maxWidth);
          
          // Draw each line of the diagnosis
          diagnosisLines.forEach((line, index) => {
            const yPosition = section2Y + 80 + (index * lineHeight);
            ctx.fillText(line, baseWidth / 2, yPosition);
          });

          // SECTION 3: ACHIEVEMENT METRIC WITH BRAIN ICON
          const diagnosisLineCount = diagnosisLines.length;
          const diagnosisHeight = diagnosisLineCount * lineHeight;
          const section3Y = section2Y + 80 + diagnosisHeight + 100;
          
          // Brain icon (larger and better positioned)
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          
          // Draw a simplified brain icon (larger and more visible)
          const brainX = baseWidth / 2 - 180;
          const brainY = section3Y;
          
          // Main brain lobes
          ctx.beginPath();
          ctx.arc(brainX, brainY, 20, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(brainX + 25, brainY - 15, 15, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(brainX + 25, brainY + 15, 15, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(brainX + 45, brainY - 25, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(brainX + 45, brainY + 25, 12, 0, 2 * Math.PI);
          ctx.fill();
          
          // Brain stem
          ctx.beginPath();
          ctx.moveTo(brainX, brainY + 20);
          ctx.lineTo(brainX, brainY + 35);
          ctx.stroke();

          // Achievement text (positioned to the right of brain icon)
          ctx.fillStyle = '#000000';
          ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('In the top 2% of ClerkSmart users this week', brainX + 80, section3Y + 10);

          // SECTION 4: CALL TO ACTION
          const section4Y = section3Y + 120;
          
          // Challenge question
          ctx.fillStyle = '#000000';
          ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Think you can do better?', baseWidth / 2, section4Y);

          // Pointing finger emoji and text
          const section5Y = section4Y + 80;
          ctx.fillStyle = '#000000';
          ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👉 Try this case on ClerkSmart', baseWidth / 2, section5Y);

          // SECTION 5: BUTTON
          const buttonY = section5Y + 100;
          const buttonWidth = 320;
          const buttonHeight = 70;
          const buttonX = (baseWidth - buttonWidth) / 2;
          
          // Button background
          ctx.fillStyle = '#14b8a6';
          ctx.beginPath();
          ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 16);
          ctx.fill();

          // Button text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Try Now', baseWidth / 2, buttonY + 45);

          // SECTION 6: BOTTOM TEXT
          const section6Y = buttonY + buttonHeight + 120;
          ctx.fillStyle = '#000000';
          ctx.font = '28px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Join thousands of medical students on ClerkSmart!', baseWidth / 2, section6Y);

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          
          if (!dataUrl || dataUrl === 'data:,') {
            throw new Error('Generated data URL is invalid');
          }
          
          console.log('Image generated successfully with dimensions:', baseWidth, 'x', baseHeight);
          resolve(dataUrl);
        } catch (drawError) {
          console.error('Drawing error:', drawError);
          reject(new Error(`Drawing error: ${drawError}`));
        }
      }).catch((error) => {
        console.error('Font loading error:', error);
        reject(new Error(`Font loading error: ${error}`));
      });
    } catch (error) {
      console.error('Canvas creation error:', error);
      reject(new Error(`Canvas creation error: ${error}`));
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