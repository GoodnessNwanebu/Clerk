'use client';

import React, { useState } from 'react';
import { ShareCard } from '../../components/ShareCard';
import { ShareData } from '../../types/share';

const TestSharePage: React.FC = () => {
  const [shareData, setShareData] = useState<ShareData>({
    diagnosis: 'Acute Myocardial Infarction',
    correctDiagnosis: 'Acute Myocardial Infarction',
    department: 'Cardiology',
    achievementText: 'Successfully diagnosed the case',
    shareMessage: 'Successfully diagnosed the case\n\nCorrectly diagnosed: Acute Myocardial Infarction\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app'
  });

  const testCases = [
    {
      diagnosis: 'Acute Myocardial Infarction',
      department: 'Cardiology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Multiple Sclerosis',
      department: 'Neurology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Appendicitis',
      department: 'General Surgery',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Pneumonia',
      department: 'Internal Medicine',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Asthma Exacerbation',
      department: 'Pediatrics',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Acute exacerbation of chronic obstructive pulmonary disease with secondary bacterial pneumonia',
      department: 'Respiratory Medicine',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Diabetic ketoacidosis with severe metabolic acidosis and hypovolemic shock',
      department: 'Endocrinology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Acute myocardial infarction with ST-segment elevation involving the anterior wall',
      department: 'Cardiology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Acute exacerbation of chronic obstructive pulmonary disease with secondary bacterial pneumonia complicated by respiratory failure requiring mechanical ventilation',
      department: 'Respiratory Medicine',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Diabetic ketoacidosis with severe metabolic acidosis, hypovolemic shock, and acute kidney injury secondary to dehydration',
      department: 'Endocrinology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Acute myocardial infarction with ST-segment elevation involving the anterior wall complicated by cardiogenic shock and ventricular fibrillation',
      department: 'Cardiology',
      achievementText: 'Successfully diagnosed the case'
    },
    {
      diagnosis: 'Acute exacerbation of chronic obstructive pulmonary disease with secondary bacterial pneumonia complicated by respiratory failure requiring mechanical ventilation and acute respiratory distress syndrome',
      department: 'Respiratory Medicine',
      achievementText: 'Successfully diagnosed the case'
    }
  ];

  const updateTestData = (testCase: any) => {
    setShareData({
      ...shareData,
      diagnosis: testCase.diagnosis,
      correctDiagnosis: testCase.diagnosis,
      department: testCase.department,
      achievementText: testCase.achievementText,
      shareMessage: `${testCase.achievementText}\n\nCorrectly diagnosed: ${testCase.diagnosis}\n\nIn the top 2% of ClerkSmart users this week\n\nCome try a patient on ClerkSmart: https://clerksmart.vercel.app`
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Share Card Preview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test different medical cases and departments
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Test Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => updateTestData(testCase)}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <div className="font-medium text-slate-900 dark:text-white">
                  {testCase.diagnosis}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {testCase.department}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Share Card Preview */}
        <div className="flex justify-center">
          <div className="transform scale-50 origin-top">
            <ShareCard shareData={shareData} />
          </div>
        </div>

        {/* Current Data Display */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Current Share Data
          </h2>
          <pre className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(shareData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestSharePage;
