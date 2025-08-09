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

  // Generate image preview when modal opens
  useEffect(() => {
    if (isOpen && shareData && !imagePreview) {
      setIsGeneratingImage(true);
      generateShareImage(shareData)
        .then((dataUrl) => {
          setImagePreview(dataUrl);
        })
        .catch((error) => {
          console.error('Error generating image preview:', error);
        })
        .finally(() => {
          setIsGeneratingImage(false);
        });
    }
  }, [isOpen, shareData, imagePreview]);

  // Clear image preview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
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

        {/* Image Preview */}
        <div className="mb-6">
          {isGeneratingImage ? (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-8 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-2"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Generating your achievement image...</p>
              </div>
            </div>
          ) : imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Achievement Share Image" 
                className="w-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-600"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Ready to share
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-8 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading preview...</p>
            </div>
          )}
        </div>

        {/* Share Info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-600">
          <p className="text-slate-700 dark:text-slate-300 text-center text-sm">
            This image will be shared along with a clickable link to ClerkSmart
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleShare}
            disabled={isGeneratingImage || !imagePreview}
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
