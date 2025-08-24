import React, { useState } from 'react';
import { Icon } from './Icon';
import ReactMarkdown from 'react-markdown';

interface CaseData {
  id: string;
  diagnosis: string;
  primaryInfo: string;
  openingLine: string;
  department: { name: string };
  savedAt: string;
  completedAt: string;
  timeSpent: number;
  clinicalSummary: string;
  patientProfile?: {
    age: string;
    occupation: string;
    educationLevel: string;
    gender: string;
  };
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    timestamp: string;
    speakerLabel?: string;
  }>;
  examinationResults: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    value?: string;
    unit?: string;
    findings?: string;
    interpretation?: string;
  }>;
  investigationResults: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    value?: string;
    unit?: string;
    findings?: string;
    interpretation?: string;
  }>;
  feedback?: {
    diagnosis: string;
    clinicalReasoning: string;
    keyLearningPoint: string;
    whatYouDidWell: string[];
    whatCouldBeImproved: string[];
    clinicalPearls: string[];
    missedOpportunities?: Array<{
      opportunity: string;
      clinicalSignificance: string;
    }>;
  };
  caseReport?: {
    id: string;
    patientInfo: {
      age: string;
      gender: string;
      presentingComplaint: string;
      historyOfPresentingIllness: string;
      pastMedicalHistory: string;
      medications: string;
      allergies: string;
      socialHistory: string;
      familyHistory: string;
    };
    history: {
      presentingComplaint: string;
      historyOfPresentingIllness: string;
      pastMedicalHistory: string;
      medications: string;
      allergies: string;
      socialHistory: string;
      familyHistory: string;
      reviewOfSystems: string;
    };
    examination: {
      generalExamination: string;
      systemicExamination: string;
      findings: string[];
      rationale: string;
    };
    investigations: {
      requested: string[];
      results: string[];
      rationale: string;
    };
    assessment: {
      differentialDiagnosis: string[];
      finalDiagnosis: string;
      reasoning: string;
    };
    management: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
      followUp: string;
    };
    learningPoints: string[];
  };
}

type TabType = 'overview' | 'management' | 'feedback' | 'conversation';

interface CaseTabContentProps {
  activeTab: TabType;
  caseData: CaseData;
  formatDate: (dateString: string) => string;
  formatTimeSpent: (minutes: number) => string;
}

export const CaseTabContent: React.FC<CaseTabContentProps> = ({
  activeTab,
  caseData,
  formatDate,
  formatTimeSpent
}) => {
  const renderOverview = () => (
    <div className="space-y-6">

            {/* Final Diagnosis */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
          <Icon name="brain" size={20} className="mr-2" />
          Final Diagnosis
        </h2>
        <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">
          {caseData.feedback?.diagnosis || caseData.diagnosis}
        </p>
      </div>
      {/* Patient Information */}
      {caseData.caseReport?.patientInfo && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
            <Icon name="user" size={20} className="mr-2" />
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Demographics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Age:</span>
                    <span>{caseData.caseReport.patientInfo.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Gender:</span>
                    <span>{caseData.caseReport.patientInfo.gender}</span>
                  </div>
                </div>
              </div>

              {/* <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Presenting Complaint</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.presentingComplaint}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">History of Presenting Illness</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.historyOfPresentingIllness}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Past Medical History</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.pastMedicalHistory}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Medications</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.medications}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Allergies</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.allergies}
                </p>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Case Details */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
          <Icon name="file-text" size={20} className="mr-2" />
          Case Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Department:</span>
              <span className="font-medium">{caseData.department.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Time Spent:</span>
              <span className="font-medium">{formatTimeSpent(caseData.timeSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Completed:</span>
              <span className="font-medium">{formatDate(caseData.completedAt)}</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );

  const renderPatient = () => (
    <div className="space-y-6">
      {caseData.caseReport?.patientInfo ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Demographics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Age:</span>
                    <span>{caseData.caseReport.patientInfo.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Gender:</span>
                    <span>{caseData.caseReport.patientInfo.gender}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Presenting Complaint</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.presentingComplaint}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">History of Presenting Illness</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.historyOfPresentingIllness}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Past Medical History</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.pastMedicalHistory}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Medications</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.medications}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Allergies</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {caseData.caseReport.patientInfo.allergies}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Patient information not available</p>
        </div>
      )}
    </div>
  );

  const renderExamination = () => (
    <div className="space-y-6">
      {caseData.caseReport?.examination ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Examination Findings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">General Examination</h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <ReactMarkdown>
                  {caseData.caseReport.examination.generalExamination}
                </ReactMarkdown>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Systemic Examination</h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <ReactMarkdown>
                  {caseData.caseReport.examination.systemicExamination}
                </ReactMarkdown>
              </div>
            </div>

            {caseData.caseReport.examination.findings.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Key Findings</h3>
                <ul className="space-y-1">
                  {caseData.caseReport.examination.findings.map((finding, index) => (
                    <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                      <Icon name="check" size={14} className="mr-2 mt-0.5 text-teal-500 flex-shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : caseData.examinationResults && caseData.examinationResults.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Examination Results</h2>
          <div className="space-y-4">
            {caseData.examinationResults.map((result, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">{result.name}</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{result.category}</span>
                </div>
                {result.value && result.unit && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Value: {result.value} {result.unit}
                  </p>
                )}
                {result.findings && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <span className="font-medium">Findings:</span> {result.findings}
                  </p>
                )}
                {result.interpretation && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Interpretation:</span> {result.interpretation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Examination data not available</p>
        </div>
      )}
    </div>
  );

  const renderInvestigations = () => (
    <div className="space-y-6">
      {caseData.caseReport?.investigations ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Investigations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Requested Investigations</h3>
              <ul className="space-y-1">
                {caseData.caseReport.investigations.requested.map((investigation, index) => (
                  <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                    <Icon name="check" size={14} className="mr-2 mt-0.5 text-teal-500 flex-shrink-0" />
                    {investigation}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Results</h3>
              <ul className="space-y-1">
                {caseData.caseReport.investigations.results.map((result, index) => (
                  <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                    <Icon name="file-text" size={14} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : caseData.investigationResults && caseData.investigationResults.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Investigation Results</h2>
          <div className="space-y-4">
            {caseData.investigationResults.map((result, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">{result.name}</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{result.category}</span>
                </div>
                {result.value && result.unit && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Value: {result.value} {result.unit}
                  </p>
                )}
                {result.findings && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <span className="font-medium">Findings:</span> {result.findings}
                  </p>
                )}
                {result.interpretation && (
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Interpretation:</span> {result.interpretation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Investigation data not available</p>
        </div>
      )}
    </div>
  );

  const renderAssessment = () => (
    <div className="space-y-6">
      {caseData.caseReport?.assessment ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Clinical Assessment</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Differential Diagnosis</h3>
              <ul className="space-y-1">
                {caseData.caseReport.assessment.differentialDiagnosis.map((diagnosis, index) => (
                  <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                    <Icon name="list" size={14} className="mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                    {diagnosis}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Final Diagnosis</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {caseData.caseReport.assessment.finalDiagnosis}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Clinical Reasoning</h3>
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <ReactMarkdown>
                  {caseData.caseReport.assessment.reasoning}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Final Diagnosis</h2>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            {caseData.feedback?.diagnosis || caseData.diagnosis}
          </p>
        </div>
      )}
    </div>
  );

  const renderManagement = () => {
    const [expandedSections, setExpandedSections] = useState({
      history: true, // Expanded by default
      examinations: false,
      investigations: false,
      assessment: false,
      management: false
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    return (
      <div className="space-y-6">
        {/* History Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => toggleSection('history')}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 flex items-center">
              <Icon name="history" size={20} className="mr-2" />
              History
            </h2>
            <Icon 
              name={expandedSections.history ? "chevron-up" : "chevron-down"} 
              size={20} 
              className="text-slate-500 dark:text-slate-400" 
            />
          </button>
          {expandedSections.history && (
            <div className="px-6 pb-6">
              {caseData.caseReport?.history ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Presenting Complaint</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.presentingComplaint}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">History of Presenting Illness</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.historyOfPresentingIllness}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Past Medical History</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.pastMedicalHistory}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Medications</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.medications}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Allergies</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.allergies}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Social History</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.socialHistory}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Family History</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.familyHistory}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Review of Systems</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.history.reviewOfSystems}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">History information not available</p>
              )}
            </div>
          )}
        </div>

        {/* Examinations Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => toggleSection('examinations')}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 flex items-center">
              <Icon name="stethoscope" size={20} className="mr-2" />
              Examinations
            </h2>
            <Icon 
              name={expandedSections.examinations ? "chevron-up" : "chevron-down"} 
              size={20} 
              className="text-slate-500 dark:text-slate-400" 
            />
          </button>
          {expandedSections.examinations && (
            <div className="px-6 pb-6">
              {caseData.caseReport?.examination ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">General Examination</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.examination.generalExamination}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Systemic Examination</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.examination.systemicExamination}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Expected Findings</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.examination.findings.map((finding, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="list" size={14} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Rationale</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.examination.rationale}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">Examination information not available</p>
              )}
            </div>
          )}
        </div>

        {/* Investigations Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => toggleSection('investigations')}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 flex items-center">
              <Icon name="microscope" size={20} className="mr-2" />
              Investigations
            </h2>
            <Icon 
              name={expandedSections.investigations ? "chevron-up" : "chevron-down"} 
              size={20} 
              className="text-slate-500 dark:text-slate-400" 
            />
          </button>
          {expandedSections.investigations && (
            <div className="px-6 pb-6">
              {caseData.caseReport?.investigations ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Requested Investigations</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.investigations.requested.map((investigation, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="list" size={14} className="mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                          {investigation}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Expected Results</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.investigations.results.map((result, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="list" size={14} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Rationale</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{caseData.caseReport.investigations.rationale}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">Investigation information not available</p>
              )}
            </div>
          )}
        </div>

        {/* Assessment Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => toggleSection('assessment')}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 flex items-center">
              <Icon name="brain" size={20} className="mr-2" />
              Assessment
            </h2>
            <Icon 
              name={expandedSections.assessment ? "chevron-up" : "chevron-down"} 
              size={20} 
              className="text-slate-500 dark:text-slate-400" 
            />
          </button>
          {expandedSections.assessment && (
            <div className="px-6 pb-6">
              {caseData.caseReport?.assessment ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Differential Diagnosis</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.assessment.differentialDiagnosis.map((diagnosis, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="list" size={14} className="mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                          {diagnosis}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Final Diagnosis</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{caseData.caseReport.assessment.finalDiagnosis}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Clinical Reasoning</h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <ReactMarkdown>{caseData.caseReport.assessment.reasoning}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">Assessment information not available</p>
              )}
            </div>
          )}
        </div>

        {/* Management Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => toggleSection('management')}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 flex items-center">
              <Icon name="clipboard-list" size={20} className="mr-2" />
              Management
            </h2>
            <Icon 
              name={expandedSections.management ? "chevron-up" : "chevron-down"} 
              size={20} 
              className="text-slate-500 dark:text-slate-400" 
            />
          </button>
          {expandedSections.management && (
            <div className="px-6 pb-6">
              {caseData.caseReport?.management ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Immediate Management</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.management.immediate.map((item, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="alert-triangle" size={14} className="mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Short-term Management</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.management.shortTerm.map((item, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="clock" size={14} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Long-term Management</h3>
                    <ul className="space-y-1">
                      {caseData.caseReport.management.longTerm.map((item, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                          <Icon name="calendar" size={14} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">Follow-up</h3>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      <ReactMarkdown>{caseData.caseReport.management.followUp}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center">Management information not available</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFeedback = () => (
    <div className="space-y-6">
      {caseData.feedback ? (
        <>
          {/* Key Learning Point */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-3">Key Learning Point</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              <ReactMarkdown>
                {caseData.feedback.keyLearningPoint}
              </ReactMarkdown>
            </div>
          </div>

          {/* What You Did Well */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
              <Icon name="check-circle" size={20} className="mr-2 text-green-500" />
              What You Did Well
            </h2>
            <ul className="space-y-3">
              {caseData.feedback.whatYouDidWell.map((point, index) => (
                <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon name="check-circle" className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" size={16}/>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      <ReactMarkdown>
                        {point}
                      </ReactMarkdown>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
              <Icon name="alert-triangle" size={20} className="mr-2 text-amber-500" />
              Areas for Improvement
            </h2>
            <ul className="space-y-3">
              {caseData.feedback.whatCouldBeImproved.map((point, index) => (
                <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon name="x-circle" className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={16}/>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      <ReactMarkdown>
                        {point}
                      </ReactMarkdown>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Pearls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
              <Icon name="lightbulb" size={20} className="mr-2 text-purple-500" />
              Clinical Pearls
            </h2>
            <ul className="space-y-3">
              {caseData.feedback.clinicalPearls.map((pearl, index) => (
                <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon name="star" className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={16}/>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      <ReactMarkdown>
                        {pearl}
                      </ReactMarkdown>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Missed Opportunities */}
          {caseData.feedback.missedOpportunities && caseData.feedback.missedOpportunities.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
                <Icon name="alert-triangle" size={20} className="mr-2 text-red-500" />
                Missed Opportunities
              </h2>
              <ul className="space-y-4">
                {caseData.feedback.missedOpportunities.map((opportunity, index) => (
                  <li key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="prose prose-slate dark:prose-invert max-w-none text-base text-slate-900 dark:text-white font-medium leading-relaxed">
                        <ReactMarkdown>
                          {opportunity.opportunity}
                        </ReactMarkdown>
                      </div>
                      <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        <ReactMarkdown>
                          {`**Clinical significance:** ${opportunity.clinicalSignificance}`}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Feedback not available</p>
        </div>
      )}
    </div>
  );

  const renderConversation = () => (
    <div className="space-y-6">
      {caseData.messages && caseData.messages.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Conversation History</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {caseData.messages.map((message, index) => (
              <div key={index} className={`flex ${message.sender === 'patient' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'patient' 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' 
                    : 'bg-teal-500 text-white'
                }`}>
                  {message.speakerLabel && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      {message.speakerLabel}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Conversation history not available</p>
        </div>
      )}
    </div>
  );

  switch (activeTab) {
    case 'overview':
      return renderOverview();
    case 'management':
      return renderManagement();
    case 'feedback':
      return renderFeedback();
    case 'conversation':
      return renderConversation();
    default:
      return null;
  }
};
