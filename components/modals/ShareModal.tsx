import React, { useState, useEffect, useRef, useCallback } from 'react';
import { shareOnWhatsAppWithImage } from '../../lib/shared/shareUtils';
import { ShareData } from '../../types/share';
import { ShareCard } from '../ShareCard';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  shareData: ShareData | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onShare, shareData }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Generate image preview when modal opens
  const generateImage = useCallback(async () => {
    if (!shareData) return;
    
    setIsGeneratingImage(true);
    setGenerationError(null);
    
    try {
      // Show the ShareCard in the DOM
      setShowShareCard(true);
      
      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (shareCardRef.current) {
        // Capture the ShareCard with html2canvas
        const canvas = await html2canvas(shareCardRef.current, {
          width: 1080,
          height: 1350,
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          ignoreElements: () => {
            // Ignore any elements that might cause issues
            return false;
          },
          onclone: (clonedDoc) => {
            // Force proper color rendering for html2canvas
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setImagePreview(dataUrl);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error('ShareCard element not found');
      }
    } catch (error) {
      console.error('Error generating image preview:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate image');
      
      // Auto-retry once with a delay
      if (retryCount === 0) {
        setTimeout(() => {
          setRetryCount(1);
          generateImage();
        }, 1000);
      }
    } finally {
      setIsGeneratingImage(false);
      setShowShareCard(false); // Hide the ShareCard after capture
    }
  }, [shareData, retryCount]);

  useEffect(() => {
    if (isOpen && shareData && !imagePreview && retryCount === 0) {
      generateImage();
    }
  }, [isOpen, shareData, imagePreview, retryCount, generateImage]);

  // Clear image preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setGenerationError(null);
      setRetryCount(0);
      setIsTransitioning(false);
    }
  }, [isOpen]);

  if (!isOpen || !shareData) return null;

  const handleTransition = (callback: () => void) => {
    setIsTransitioning(true);
    // Add a longer delay for a more natural, smoother transition
    setTimeout(() => {
      callback();
    }, 800);
  };

  const handleShare = async () => {
    if (isTransitioning) return;
    
    handleTransition(async () => {
      try {
        // Pass the generated image to the sharing function
        await shareOnWhatsAppWithImage(shareData, imagePreview);
        onShare();
      } catch (error) {
        console.error('Error sharing:', error);
        onShare();
      }
    });
  };

  const handleSkip = () => {
    if (isTransitioning) return;
    handleTransition(onClose);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setImagePreview(null);
    setGenerationError(null);
    generateImage();
  };

  // Check if dark mode is enabled
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <>
      {/* Hidden ShareCard for image generation */}
      {showShareCard && shareData && (
        <div 
          ref={shareCardRef}
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '-9999px',
            width: '1080px',
            height: '1350px'
          }}
        >
          <ShareCard shareData={shareData} />
        </div>
      )}
      
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      >
        <div 
          className={`rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-700 ease-in-out ${isTransitioning ? 'scale-90 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}
          style={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }}
        >
        
        {/* Header */}
        <div className="text-center mb-6">
          <h3 
            className="text-xl font-bold mb-2 transition-all duration-500"
            style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
          >
            {isTransitioning ? 'Returning to Home...' : 'Share Your Achievement'}
          </h3>
          <p 
            className="text-sm transition-all duration-500"
            style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
          >
            {isTransitioning ? 'Thank you for using ClerkSmart!' : 'Share this beautiful image with your friends'}
          </p>
        </div>

        {/* Loading overlay during transition - appears after a brief pause */}
        {isTransitioning && (
          <div 
            className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 animate-in fade-in duration-500 delay-200"
            style={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }}
          >
            <div className="text-center">
              <div 
                className="animate-spin rounded-full h-10 w-10 border-3 border-t-transparent mx-auto mb-4"
                style={{ 
                  borderColor: '#14b8a6',
                  borderTopColor: 'transparent'
                }}
              ></div>
              <p 
                className="text-sm font-medium"
                style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}
              >
                Returning to home...
              </p>
              <p 
                className="text-xs mt-1"
                style={{ color: isDarkMode ? '#64748b' : '#64748b' }}
              >
                Just a moment
              </p>
            </div>
          </div>
        )}

        {/* Image Preview - Elegantly Scaled */}
        <div className="mb-6">
          {isGeneratingImage ? (
            <div 
              className="rounded-xl p-8 flex items-center justify-center"
              style={{ 
                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                aspectRatio: '2/3'
              }}
            >
              <div className="text-center">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
                  style={{ borderColor: '#14b8a6' }}
                ></div>
                <p 
                  className="text-sm"
                  style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                >
                  {retryCount > 0 ? 'Retrying image generation...' : 'Generating your achievement image...'}
                </p>
              </div>
            </div>
          ) : generationError ? (
            <div 
              className="rounded-xl p-8 flex items-center justify-center"
              style={{ 
                backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
                aspectRatio: '2/3'
              }}
            >
              <div className="text-center">
                <div 
                  className="mb-2"
                  style={{ color: '#ef4444' }}
                >
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p 
                  className="text-sm mb-3"
                  style={{ color: isDarkMode ? '#fca5a5' : '#dc2626' }}
                >
                  Failed to generate image
                </p>
                <p 
                  className="text-xs mb-4"
                  style={{ color: isDarkMode ? '#fca5a5' : '#ef4444' }}
                >
                  {generationError}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : imagePreview ? (
            <div className="relative">
              {/* Container with aspect ratio for portrait image */}
              <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                <img 
                  src={imagePreview} 
                  alt="Achievement Share Image" 
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                  style={{ 
                    objectPosition: 'center',
                    border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`
                  }}
                />
                <div 
                  className="absolute top-3 right-3 text-white text-xs px-2 py-1 rounded-full shadow-lg"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  Ready to share
                </div>
                {/* Quality indicator */}
                <div 
                  className="absolute bottom-3 left-3 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                >
                  HD Quality
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="rounded-xl p-8 flex items-center justify-center"
              style={{ 
                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                aspectRatio: '2/3'
              }}
            >
              <p 
                className="text-sm"
                style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
              >
                Loading preview...
              </p>
            </div>
          )}
        </div>

        {/* Share Info */}
        <div 
          className="rounded-xl p-4 mb-6 border"
          style={{
            backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#f8fafc',
            borderColor: isDarkMode ? '#475569' : '#e2e8f0'
          }}
        >
          <p 
            className="text-center text-sm"
            style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}
          >
            {generationError 
              ? "You can still share your achievement via text message"
              : "This high-definition image will be shared along with a clickable link to ClerkSmart"
            }
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleShare}
            disabled={isGeneratingImage || isTransitioning}
            className="flex-1 py-3 rounded-lg font-semibold text-white hover:scale-105 active:scale-95 transform transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <span className="transition-all duration-200">{isGeneratingImage ? 'Generating...' : isTransitioning ? 'Sharing...' : 'Share'}</span>
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isTransitioning}
            className="flex-1 py-3 rounded-lg active:scale-95 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
              color: isDarkMode ? '#cbd5e1' : '#334155'
            }}
            onMouseEnter={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#475569' : '#cbd5e1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#334155' : '#e2e8f0';
              }
            }}
          >
            <span className="transition-all duration-200">{isTransitioning ? 'Returning...' : 'Skip'}</span>
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default ShareModal;