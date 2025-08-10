import React, { useState, useEffect } from 'react';
import { generateShareImage, shareOnWhatsAppWithImage } from '../lib/shareUtils';
import { ShareData } from '../lib/shareUtils';

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

  // Generate image preview when modal opens
  const generateImage = async () => {
    if (!shareData) return;
    
    setIsGeneratingImage(true);
    setGenerationError(null);
    
    try {
      const dataUrl = await generateShareImage(shareData);
      setImagePreview(dataUrl);
      setRetryCount(0); // Reset retry count on success
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
    }
  };

  useEffect(() => {
    if (isOpen && shareData && !imagePreview && retryCount === 0) {
      generateImage();
    }
  }, [isOpen, shareData, imagePreview, retryCount]);

  // Clear image preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setGenerationError(null);
      setRetryCount(0);
    }
  }, [isOpen]);

  if (!isOpen || !shareData) return null;

  const handleShare = async () => {
    try {
      await shareOnWhatsAppWithImage(shareData);
      onShare();
    } catch (error) {
      console.error('Error sharing:', error);
      onShare();
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setImagePreview(null);
    setGenerationError(null);
    generateImage();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Share Your Achievement
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Share this beautiful image with your friends
          </p>
        </div>

        {/* Image Preview - Elegantly Scaled */}
        <div className="mb-6">
          {isGeneratingImage ? (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-8 flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {retryCount > 0 ? 'Retrying image generation...' : 'Generating your achievement image...'}
                </p>
              </div>
            </div>
          ) : generationError ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm mb-3">
                  Failed to generate image
                </p>
                <p className="text-red-500 dark:text-red-400 text-xs mb-4">
                  {generationError}
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
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
                  className="w-full h-full object-cover rounded-xl shadow-lg border border-slate-200 dark:border-slate-600"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                  Ready to share
                </div>
                {/* Quality indicator */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  HD Quality
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-8 flex items-center justify-center" style={{ aspectRatio: '2/3' }}>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading preview...</p>
            </div>
          )}
        </div>

        {/* Share Info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-600">
          <p className="text-slate-700 dark:text-slate-300 text-center text-sm">
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
            disabled={isGeneratingImage}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-semibold text-white hover:scale-105 transform transition-transform flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            <span>{isGeneratingImage ? 'Generating...' : 'Share'}</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;