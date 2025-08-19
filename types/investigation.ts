// Investigation Types

// Base interface for all investigation results
interface BaseInvestigationResult {
  name: string;
  type: 'quantitative' | 'descriptive';
  category: 'laboratory' | 'imaging' | 'pathology' | 'specialized';
  urgency: 'routine' | 'urgent' | 'critical';
}

// Quantitative results (for graphs/charts)
interface QuantitativeResult extends BaseInvestigationResult {
  type: 'quantitative';
  value: number;
  unit: string;
  range: {
    low: number;
    high: number;
  };
  status: 'Normal' | 'High' | 'Low' | 'Critical';
}

// Descriptive results (for reports)
interface DescriptiveResult extends BaseInvestigationResult {
  type: 'descriptive';
  findings: string;
  impression: string;
  recommendation?: string;
  abnormalFlags: string[];
  reportType: 'radiology' | 'pathology' | 'ecg' | 'echo' | 'specialist';
}

// Union type for all investigation results
type InvestigationResult = QuantitativeResult | DescriptiveResult;

// Legacy type alias for backward compatibility
type LegacyInvestigationResult = QuantitativeResult;

export type {
  BaseInvestigationResult,
  QuantitativeResult,
  DescriptiveResult,
  InvestigationResult,
  LegacyInvestigationResult
};
