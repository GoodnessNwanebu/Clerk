import React from 'react';
import { Icon } from './Icon';

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
    examination: {
      generalExamination: string;
      systemicExamination: string;
      findings: string[];
    };
    investigations: {
      requested: string[];
      results: string[];
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

type TabType = 'overview' | 'patient' | 'examination' | 'investigations' | 'assessment' | 'management' | 'feedback' | 'conversation';

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
      {/* Clinical Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
          <Icon name="file-text" size={20} className="mr-2" />
          Clinical Summary
        </h2>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
          {caseData.clinicalSummary}
        </p>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-3">Case Details</h3>
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

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-3">Final Diagnosis</h3>
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            {caseData.feedback?.diagnosis || caseData.diagnosis}
          </p>
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
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {caseData.caseReport.examination.generalExamination}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Systemic Examination</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {caseData.caseReport.examination.systemicExamination}
              </p>
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
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {caseData.caseReport.assessment.reasoning}
              </p>
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

  const renderManagement = () => (
    <div className="space-y-6">
      {caseData.caseReport?.management ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4">Management Plan</h2>
          
          <div className="space-y-6">
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
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {caseData.caseReport.management.followUp}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-center">Management plan not available</p>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      {caseData.feedback ? (
        <>
          {/* Key Learning Point */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-3">Key Learning Point</h2>
            <p className="text-slate-900 dark:text-white leading-relaxed">{caseData.feedback.keyLearningPoint}</p>
          </div>

          {/* What You Did Well */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
              <Icon name="check-circle" size={20} className="mr-2 text-green-500" />
              What You Did Well
            </h2>
            <ul className="space-y-3">
              {caseData.feedback.whatYouDidWell.map((point, index) => (
                <li key={index} className="flex items-start">
                  <Icon name="check" size={16} className="mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-900 dark:text-white">{point}</span>
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
                <li key={index} className="flex items-start">
                  <Icon name="arrow-right" size={16} className="mr-3 mt-0.5 text-amber-500 flex-shrink-0" />
                  <span className="text-slate-900 dark:text-white">{point}</span>
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
            <div className="space-y-3">
              {caseData.feedback.clinicalPearls.map((pearl, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <p className="text-green-800 dark:text-green-200 font-medium">• {pearl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Missed Opportunities */}
          {caseData.feedback.missedOpportunities && caseData.feedback.missedOpportunities.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-teal-700 dark:text-teal-400 mb-4 flex items-center">
                <Icon name="alert-triangle" size={20} className="mr-2 text-red-500" />
                Missed Opportunities
              </h2>
              <div className="space-y-4">
                {caseData.feedback.missedOpportunities.map((opportunity, index) => (
                  <div key={index} className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="font-semibold text-red-800 dark:text-red-200 mb-2">{opportunity.opportunity}</p>
                    <p className="text-red-700 dark:text-red-300 text-sm italic">
                      <strong>Clinical significance:</strong> {opportunity.clinicalSignificance}
                    </p>
                  </div>
                ))}
              </div>
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
    case 'patient':
      return renderPatient();
    case 'examination':
      return renderExamination();
    case 'investigations':
      return renderInvestigations();
    case 'assessment':
      return renderAssessment();
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
