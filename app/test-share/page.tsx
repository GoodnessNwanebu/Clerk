'use client';

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShareCard } from '../../components/ShareCard';
import ShareModal from '../../components/modals/ShareModal';
import { ShareData } from '../../types/share';

export default function TestSharePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState('short');

  const testData: Record<string, ShareData> = {
    short: {
      diagnosis: 'Acute Myocardial Infarction',
      correctDiagnosis: 'Acute Myocardial Infarction',
      department: 'Cardiology',
      achievementText: 'Successfully diagnosed a critical cardiac emergency',
      shareMessage: 'Successfully diagnosed a critical cardiac emergency\n\nCorrectly diagnosed: Acute Myocardial Infarction\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app'
    },
    medium: {
      diagnosis: 'Acute Coronary Syndrome with ST-Elevation Myocardial Infarction',
      correctDiagnosis: 'Acute Coronary Syndrome with ST-Elevation Myocardial Infarction',
      department: 'Emergency Medicine',
      achievementText: 'Demonstrated excellent clinical reasoning in emergency care',
      shareMessage: 'Demonstrated excellent clinical reasoning in emergency care\n\nCorrectly diagnosed: Acute Coronary Syndrome with ST-Elevation Myocardial Infarction\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app'
    },
    long: {
      diagnosis: 'Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion and Cardiogenic Shock',
      correctDiagnosis: 'Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion and Cardiogenic Shock',
      department: 'Interventional Cardiology',
      achievementText: 'Mastered complex cardiac pathology identification and management',
      shareMessage: 'Mastered complex cardiac pathology identification and management\n\nCorrectly diagnosed: Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion and Cardiogenic Shock\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app'
    },
    veryLong: {
      diagnosis: 'Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion, Cardiogenic Shock, and Multi-Organ Dysfunction Syndrome Requiring Immediate Percutaneous Coronary Intervention',
      correctDiagnosis: 'Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion, Cardiogenic Shock, and Multi-Organ Dysfunction Syndrome Requiring Immediate Percutaneous Coronary Intervention',
      department: 'Cardiothoracic Surgery',
      achievementText: 'Exhibited exceptional diagnostic skills in critical care scenarios',
      shareMessage: 'Exhibited exceptional diagnostic skills in critical care scenarios\n\nCorrectly diagnosed: Acute ST-Elevation Myocardial Infarction with Left Anterior Descending Artery Occlusion, Cardiogenic Shock, and Multi-Organ Dysfunction Syndrome Requiring Immediate Percutaneous Coronary Intervention\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app'
    }
  };

  const currentData = testData[selectedTest];

  const handleShare = () => {
    console.log('Share clicked!');
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">ShareCard Test Page</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Different Diagnosis Lengths</h2>
          <div className="flex flex-wrap gap-4">
            {Object.keys(testData).map((test) => (
              <button
                key={test}
                onClick={() => setSelectedTest(test)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTest === test
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {test.charAt(0).toUpperCase() + test.slice(1)} Diagnosis
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Test Data:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Diagnosis:</strong> {currentData.diagnosis}</p>
              <p><strong>Department:</strong> {currentData.department}</p>
              <p><strong>Achievement:</strong> {currentData.achievementText}</p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div className="flex justify-center">
            <div className="scale-50 origin-top">
              <ShareCard shareData={currentData} />
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Image Generation</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
            >
              Open Share Modal
            </button>
            <button
              onClick={() => {
                const element = document.createElement('div');
                element.style.position = 'absolute';
                element.style.left = '-9999px';
                element.style.top = '-9999px';
                document.body.appendChild(element);
                
                // Render ShareCard directly
                const root = createRoot(element);
                root.render(<ShareCard shareData={currentData} />);
                
                setTimeout(() => {
                  console.log('ShareCard rendered for testing');
                  document.body.removeChild(element);
                }, 100);
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Test Direct Render
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isModalOpen}
        shareData={currentData}
        onClose={handleClose}
        onShare={handleShare}
      />
    </div>
  );
}
