// Examination Types

// Base interface for all examination results
interface BaseExaminationResult {
  name: string;
  type: 'quantitative' | 'descriptive';
  category: 'vital_signs' | 'system_examination' | 'special_tests';
  urgency: 'routine' | 'urgent' | 'critical';
}

// Quantitative examination results (for vitals, measurements)
interface QuantitativeExaminationResult extends BaseExaminationResult {
  type: 'quantitative';
  value: number;
  unit: string;
  range: {
    low: number;
    high: number;
  };
  status: 'Normal' | 'High' | 'Low' | 'Critical';
}

// Descriptive examination results (for system examinations, findings)
interface DescriptiveExaminationResult extends BaseExaminationResult {
  type: 'descriptive';
  findings: string;
  impression: string;
  recommendation?: string;
  abnormalFlags: string[];
  reportType: 'cardiovascular' | 'respiratory' | 'abdominal' | 'neurological' | 'musculoskeletal' | 'general' | 'obstetric' | 'pediatric';
}

// Union type for all examination results
type ExaminationResult = QuantitativeExaminationResult | DescriptiveExaminationResult;

export type {
  BaseExaminationResult,
  QuantitativeExaminationResult,
  DescriptiveExaminationResult,
  ExaminationResult
};
