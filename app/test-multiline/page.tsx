"use client";

import React, { useState, useEffect } from 'react';
import { generateShareImage, ShareData } from '../../lib/shareUtils';

export default function TestMultilinePage() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testShareData: ShareData = {
    diagnosis: "Acute Coronary Syndrome with ST-Elevation Myocardial Infarction and Left Ventricular Dysfunction",
    correctDiagnosis: "Acute Coronary Syndrome with ST-Elevation Myocardial Infarction and Left Ventricular Dysfunction",
    department: "Cardiology",
    achievementText: "I cracked the case!",
    shareMessage: "Check out my achievement on ClerkSmart!"
  };

  const generateTestImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const dataUrl = await generateShareImage(testShareData);
      setImageDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateTestImage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          📝 Multi-Line Text Wrapping Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Long Diagnosis:</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 font-mono text-sm">
              "{testShareData.diagnosis}"
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Length: {testShareData.diagnosis.length} characters
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-4">Expected Behavior:</h3>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
            <li>✅ <strong>Text wrapping</strong> - Long diagnosis should wrap to multiple lines</li>
            <li>✅ <strong>No text cutoff</strong> - All text should be visible within canvas bounds</li>
            <li>✅ <strong>Dynamic spacing</strong> - Other elements should adjust position based on line count</li>
            <li>✅ <strong>Professional appearance</strong> - Clean, readable multi-line text</li>
          </ul>

          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating image with multi-line text...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Error: {error}</p>
              <button 
                onClick={generateTestImage}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {imageDataUrl && (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Generated Image:</h3>
              <div className="inline-block border-4 border-gray-300 rounded-lg overflow-hidden">
                <img 
                  src={imageDataUrl} 
                  alt="Multi-line diagnosis image" 
                  className="max-w-full h-auto"
                  style={{ maxHeight: '600px' }}
                />
              </div>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={() => window.open(imageDataUrl, '_blank')}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  🔍 View Full Size
                </button>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = imageDataUrl;
                    link.download = 'clerksmart-multiline-test.png';
                    link.click();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  💾 Download
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
