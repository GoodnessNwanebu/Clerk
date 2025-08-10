'use client';

import React, { useState } from 'react';
import { generateShareImage } from '../../lib/shareUtils';
import { Icon } from '../../components/Icon';

const TestShareImagePage: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleShareData = {
    diagnosis: 'Pulmonary Embolism',
    correctDiagnosis: 'Pulmonary Embolism',
    department: 'Emergency Medicine',
    achievementText: 'I cracked the case!',
    shareMessage: 'In the top 2% of ClerkSmart users this week'
  };

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const generatedImageUrl = await generateShareImage(sampleShareData);
      setImageUrl(generatedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      console.error('Error generating image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'clerksmart-achievement.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">Share Image Test</h1>
          <p className="text-center text-slate-600 dark:text-slate-400">
            Test the new minimalist shareable image design
          </p>
        </header>

        <div className="space-y-8">
          {/* Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Sample Data</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Diagnosis:</strong> {sampleShareData.diagnosis}</div>
              <div><strong>Department:</strong> {sampleShareData.department}</div>
              <div><strong>Achievement:</strong> {sampleShareData.achievementText}</div>
            </div>
            
            <div className="mt-6 space-x-4">
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Icon name="loader-2" size={20} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Icon name="image" size={20} />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
              
              {imageUrl && (
                <button
                  onClick={handleDownload}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Icon name="download" size={20} />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <Icon name="alert-circle" size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {imageUrl && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
              <div className="flex justify-center">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Generated share image" 
                    className="max-w-full h-auto"
                    style={{ maxWidth: '400px' }}
                  />
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                <p>Image dimensions: 1080 x 1350 pixels</p>
                <p>Optimized for social media sharing</p>
              </div>
            </div>
          )}

          {/* Design Notes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
              <Icon name="lightbulb" size={20} />
              <span>Design Features</span>
            </h3>
            <ul className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
              <li>• Clean minimalist design with white background</li>
              <li>• Teal color scheme (#14b8a6) for branding</li>
              <li>• Proper text hierarchy with different font sizes</li>
              <li>• Custom stethoscope and brain icons</li>
              <li>• Rounded button with call-to-action</li>
              <li>• Optimized for social media sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestShareImagePage;
