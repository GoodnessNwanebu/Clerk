import { CaseState, Feedback, ComprehensiveFeedback } from '../types';

export interface ShareData {
  diagnosis: string;
  correctDiagnosis: string;
  department: string;
  achievementText: string;
  shareMessage: string;
}

// Helper function to wrap text to fit within a specified width
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  
  if (words.length === 0) return lines;
  
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  
  // Limit to maximum 5 lines to prevent excessive height
  return lines.slice(0, 5);
};

// Helper function to draw multiline text
const drawMultilineText = (
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number,
  textAlign: CanvasTextAlign = 'center'
) => {
  // Truncate text if it's extremely long to prevent layout issues
  const maxChars = 200; // Maximum characters before truncation
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
  
  const lines = wrapText(ctx, truncatedText, maxWidth);
  
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + (index * lineHeight));
  });
  
  return lines.length * lineHeight; // Return total height used
};

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
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        reject(new Error('Document not available - not in browser environment'));
        return;
      }

      // Create canvas with simple setup - NO SCALING
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Simple dimensions - NO DEVICE PIXEL RATIO SCALING
      const baseWidth = 1080;
      let baseHeight = 1500; // Will be adjusted dynamically if needed
      
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      
      // NO SCALING - 1:1 pixel mapping
      canvas.style.width = baseWidth + 'px';
      canvas.style.height = baseHeight + 'px';

      console.log('Canvas setup:', {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        devicePixelRatio: window.devicePixelRatio
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

      // Load all fonts for the complete design
      const loadFont = async () => {
        try {
          if ('fonts' in document) {
            await (document as any).fonts.load('bold 90px Inter, sans-serif');   // Hero text
            await (document as any).fonts.load('bold 60px Inter, sans-serif');   // Diagnosis
            await (document as any).fonts.load('bold 80px Inter, sans-serif');   // Logo
            await (document as any).fonts.load('bold 40px Inter, sans-serif');   // CTA
            await (document as any).fonts.load('bold 35px Inter, sans-serif');   // Badge
            await (document as any).fonts.load('35px Inter, sans-serif');        // Labels (increased)
            await (document as any).fonts.load('40px Inter, sans-serif');        // Department (increased)
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
          // Calculate required height for all text elements
          const calculateRequiredHeight = () => {
            let totalHeight = 140; // Starting Y position for logo
            
            // Achievement text height
            ctx.font = 'bold 70px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
            const achievementMaxWidth = baseWidth - 200;
            const achievementLines = wrapText(ctx, `🎉 ${shareData.achievementText} 🎯`, achievementMaxWidth);
            totalHeight += achievementLines.length * 85 + 80; // Achievement text + spacing
            
            // Diagnosis section
            totalHeight += 100; // "Correctly diagnosed:" label
            ctx.font = 'bold 60px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
            const diagnosisMaxWidth = baseWidth - 150;
            const diagnosisLines = wrapText(ctx, shareData.diagnosis, diagnosisMaxWidth);
            totalHeight += diagnosisLines.length * 75 + 60; // Diagnosis text + spacing
            
            // Achievement badge
            totalHeight += 80; // Badge spacing
            
            // Department text
            ctx.font = '40px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
            const departmentMaxWidth = baseWidth - 200;
            const departmentLines = wrapText(ctx, shareData.department, departmentMaxWidth);
            totalHeight += departmentLines.length * 50 + 40; // Department text + spacing
            
            // Call to action and bottom margin
            totalHeight += 200; // CTA + bottom margin
            
            return Math.max(totalHeight, 1500); // Minimum height of 1500px
          };
          
          const requiredHeight = calculateRequiredHeight();
          
          // Adjust canvas height if needed
          if (requiredHeight > baseHeight) {
            baseHeight = requiredHeight;
            canvas.height = baseHeight;
            canvas.style.height = baseHeight + 'px';
          }
          
          // Create a clean gradient background
          const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
          gradient.addColorStop(0, '#0f172a'); // Deep slate
          gradient.addColorStop(0.7, '#1e293b'); // Medium slate
          gradient.addColorStop(1, '#334155'); // Lighter slate
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, baseWidth, baseHeight);

          // Add fun geometric accents and celebration elements
          ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
          ctx.beginPath();
          ctx.arc(baseWidth * 0.85, baseHeight * 0.15, 60, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(baseWidth * 0.15, baseHeight * 0.85, 40, 0, 2 * Math.PI);
          ctx.fill();
          
          // Add celebration sparkles
          ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // Gold sparkles
          const sparklePositions = [
            { x: baseWidth * 0.2, y: baseHeight * 0.25 },
            { x: baseWidth * 0.8, y: baseHeight * 0.35 },
            { x: baseWidth * 0.1, y: baseHeight * 0.7 },
            { x: baseWidth * 0.9, y: baseHeight * 0.6 },
            { x: baseWidth * 0.3, y: baseHeight * 0.8 }
          ];
          
          sparklePositions.forEach(pos => {
            // Draw star/sparkle
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - 8);
            ctx.lineTo(pos.x + 3, pos.y - 3);
            ctx.lineTo(pos.x + 8, pos.y);
            ctx.lineTo(pos.x + 3, pos.y + 3);
            ctx.lineTo(pos.x, pos.y + 8);
            ctx.lineTo(pos.x - 3, pos.y + 3);
            ctx.lineTo(pos.x - 8, pos.y);
            ctx.lineTo(pos.x - 3, pos.y - 3);
            ctx.closePath();
            ctx.fill();
          });

          // SECTION 1: BRAND LOGO (Top) - with 20px margin
          const section1Y = 140; // 20px margin from top
          
          // ClerkSmart text
          ctx.fillStyle = '#14b8a6';
          ctx.font = 'bold 80px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ClerkSmart', baseWidth / 2, section1Y);

          // SECTION 2: HERO ACHIEVEMENT TEXT (Main focal point) - FUN VERSION
          const section2Y = 380; // Increased spacing from logo
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 70px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          
          // Add fun emoji and make text more engaging with multiline support
          const funAchievementText = `🎉 ${shareData.achievementText} 🎯`;
          const achievementMaxWidth = baseWidth - 200; // 100px margin on each side
          const achievementLineHeight = 85; // Slightly larger than font size for spacing
          const achievementHeight = drawMultilineText(
            ctx, 
            funAchievementText, 
            baseWidth / 2, 
            section2Y, 
            achievementMaxWidth, 
            achievementLineHeight
          );

          // SECTION 3: DIAGNOSIS SECTION
          const section3Y = section2Y + achievementHeight + 80; // Dynamic spacing based on achievement text height
          
          // Diagnosis label (increased font size)
          ctx.fillStyle = '#94a3b8';
          ctx.font = '35px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Correctly diagnosed:', baseWidth / 2, section3Y);

          // Diagnosis value (highlight) with multiline support
          ctx.fillStyle = '#14b8a6';
          ctx.font = 'bold 60px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          
          const diagnosisMaxWidth = baseWidth - 150; // 75px margin on each side
          const diagnosisLineHeight = 75; // Slightly larger than font size for spacing
          const diagnosisHeight = drawMultilineText(
            ctx, 
            shareData.diagnosis, 
            baseWidth / 2, 
            section3Y + 100, 
            diagnosisMaxWidth, 
            diagnosisLineHeight
          );

          // SECTION 4: ACHIEVEMENT BADGE (dynamic spacing from diagnosis) - FUN VERSION
          const section4Y = section3Y + 100 + diagnosisHeight + 60; // Dynamic spacing based on diagnosis text height
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 35px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🏆 In the top 2% of ClerkSmart users this week', baseWidth / 2, section4Y);

          // SECTION 5: DEPARTMENT INFO (increased font size) with multiline support
          const section5Y = section4Y + 80; // Dynamic spacing from achievement badge
          ctx.fillStyle = '#64748b';
          ctx.font = '40px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          
          const departmentMaxWidth = baseWidth - 200; // 100px margin on each side
          const departmentLineHeight = 50; // Slightly larger than font size for spacing
          const departmentHeight = drawMultilineText(
            ctx, 
            shareData.department, 
            baseWidth / 2, 
            section5Y, 
            departmentMaxWidth, 
            departmentLineHeight
          );

          // SECTION 6: CALL TO ACTION (positioned dynamically) - FUN VERSION
          const section6Y = section5Y + departmentHeight + 100; // Dynamic positioning after department
          ctx.fillStyle = '#14b8a6';
          ctx.font = 'bold 30px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚀 Join thousands of medical students on ClerkSmart!', baseWidth / 2, section6Y);

          // Add a subtle accent line (properly positioned between achievement and department)
          ctx.strokeStyle = '#14b8a6';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(200, section5Y + departmentHeight + 40); // Position after department text
          ctx.lineTo(baseWidth - 200, section5Y + departmentHeight + 40);
          ctx.stroke();

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