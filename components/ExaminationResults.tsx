'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { ExaminationResult, QuantitativeExaminationResult, DescriptiveExaminationResult } from '../types';

// Helper functions for styling (adopted from investigation results)
const getStatusColors = (status: QuantitativeExaminationResult['status']) => {
  switch (status) {
    case 'Normal': return 'bg-green-500';
    case 'High': return 'bg-amber-500';
    case 'Low': return 'bg-blue-500';
    case 'Critical': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusBadgeColors = (status: QuantitativeExaminationResult['status']) => {
  switch (status) {
    case 'Normal': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'High': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getUrgencyColors = (urgency: ExaminationResult['urgency']) => {
  switch (urgency) {
    case 'critical': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
    case 'urgent': return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10';
    default: return 'border-l-slate-300 dark:border-l-slate-600';
  }
};

// Vital signs bar component (adopted from investigation results)
const VitalSignsBar: React.FC<{ result: QuantitativeExaminationResult; animate: boolean }> = ({ result, animate }) => {
  const { value, range, status } = result;
  
  // Improved logic: Progress bar should visually represent the relationship to normal range
  let progressBarWidth, indicatorPosition;
  
  if (status === 'Low') {
    // For low values: short progress bar, indicator shows it's below normal
    progressBarWidth = (value / range.high) * 100; // Percentage of normal high
    indicatorPosition = progressBarWidth; // Indicator at the value position
  } else if (status === 'High') {
    // For high values: longer progress bar, indicator shows it's above normal
    progressBarWidth = (value / (range.high * 1.5)) * 100; // Extend range to show high values
    indicatorPosition = progressBarWidth; // Indicator at the value position
  } else if (status === 'Critical') {
    // For critical values: very long progress bar to show severity
    progressBarWidth = (value / (range.high * 2)) * 100;
    indicatorPosition = progressBarWidth;
  } else {
    // For normal values: progress bar fills the normal range
    progressBarWidth = 100; // Full width for normal range
    indicatorPosition = ((value - range.low) / (range.high - range.low)) * 100; // Position within normal range
  }
  
  // Clamp values to prevent overflow
  const clampedProgressWidth = Math.min(Math.max(progressBarWidth, 0), 100);
  const clampedIndicatorPosition = Math.min(Math.max(indicatorPosition, 0), 100);

  return (
    <div className="relative h-4 sm:h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      {/* Progress bar */}
      <div
        className={`h-full transition-all duration-1000 ease-out ${getStatusColors(status)} ${animate ? 'opacity-100' : 'opacity-0'}`}
        style={{ width: animate ? `${clampedProgressWidth}%` : '0%' }}
      />
      
      {/* Value indicator */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-1 h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}
        style={{ left: `${clampedIndicatorPosition}%` }}
      />
      
      {/* Normal range indicator (subtle line) */}
      {status !== 'Normal' && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-full bg-slate-400 dark:bg-slate-500 opacity-50"
          style={{ 
            left: `${(range.low / (range.high * (status === 'High' ? 1.5 : status === 'Critical' ? 2 : 1))) * 100}%`,
            width: `${((range.high - range.low) / (range.high * (status === 'High' ? 1.5 : status === 'Critical' ? 2 : 1))) * 100}%`
          }}
        />
      )}
    </div>
  );
};

// Quantitative examination results section
const QuantitativeExaminationResults: React.FC<{ results: QuantitativeExaminationResult[]; animate: boolean }> = ({ results, animate }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
        <Icon name="activity" size={20} className="text-teal-500" />
        <span>Vital Signs & Measurements</span>
      </h4>
      <div className="space-y-6 sm:space-y-8">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`border-l-4 pl-6 sm:pl-8 py-4 sm:py-5 transition-all duration-500 ${getUrgencyColors(result.urgency)}`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200">
                  {result.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    {result.value}
                  </span>
                  <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                    {result.unit}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColors(result.status)}`}>
                    {result.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 sm:p-5">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                  <span>Normal Range: {result.range.low} - {result.range.high} {result.unit}</span>
                </div>
                <VitalSignsBar result={result} animate={animate} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get examination icon
const getExaminationIcon = (reportType: DescriptiveExaminationResult['reportType']) => {
  switch (reportType) {
    case 'cardiovascular':
      return 'heart';
    case 'respiratory':
      return 'lungs';
    case 'abdominal':
      return 'stomach';
    case 'neurological':
      return 'brain';
    case 'musculoskeletal':
      return 'bone';
    case 'obstetric':
      return 'baby';
    case 'pediatric':
      return 'child';
    default:
      return 'stethoscope';
  }
};

// Descriptive examination results section
const DescriptiveExaminationResults: React.FC<{ results: DescriptiveExaminationResult[]; animate: boolean }> = ({ results, animate }) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
        <Icon name="stethoscope" size={20} className="text-emerald-500" />
        <span>System Examinations</span>
      </h4>
      <div className="space-y-4 sm:space-y-6">
        {results.map((result, index) => {
          const isExpanded = expandedCards.has(index);
          const hasAbnormalFlags = result.abnormalFlags && result.abnormalFlags.length > 0;
          
          return (
            <div 
              key={index}
              className={`border-l-4 transition-all duration-500 ${getUrgencyColors(result.urgency)}`}
              style={{ transitionDelay: `${index * 100}ms`, opacity: animate ? 1 : 0 }}
            >
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleCard(index)}
                  className="w-full p-5 sm:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Icon 
                        name={getExaminationIcon(result.reportType)} 
                        size={22} 
                        className={hasAbnormalFlags ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'} 
                      />
                      <div>
                        <h5 className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg mb-1">
                          {result.name}
                        </h5>
                        {hasAbnormalFlags && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {result.abnormalFlags.slice(0, 2).map((flag, flagIndex) => (
                              <span 
                                key={flagIndex} 
                                className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs sm:text-sm rounded-full font-medium"
                              >
                                {flag}
                              </span>
                            ))}
                            {result.abnormalFlags.length > 2 && (
                              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs sm:text-sm rounded-full font-medium">
                                +{result.abnormalFlags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Icon 
                      name={isExpanded ? 'chevrons-right' : 'chevrons-right'} 
                      size={18} 
                      className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <div className="pt-5 space-y-5">
                      <div>
                        <h6 className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-3">FINDINGS:</h6>
                        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                          {result.findings}
                        </p>
                      </div>
                      
                      <div>
                        <h6 className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-3">IMPRESSION:</h6>
                        <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-medium leading-relaxed">
                          {result.impression}
                        </p>
                      </div>

                      {result.recommendation && (
                        <div>
                          <h6 className="font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-3">RECOMMENDATION:</h6>
                          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                            {result.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main component
export const ExaminationResults: React.FC<{ results: ExaminationResult[] }> = ({ results }) => {
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'vitals' | 'examinations'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [results]);

  const handleReset = () => {
    setAnimate(false);
    setTimeout(() => setAnimate(true), 100);
  };

  if (results.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/50 p-6 sm:p-8 rounded-xl text-center text-slate-500 dark:text-slate-400">
        <Icon name="stethoscope" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <p className="text-lg sm:text-xl font-medium mb-3">No examination results available.</p>
        <p className="text-sm sm:text-base">Please specify examinations like "cardiovascular examination", "respiratory examination", "abdominal examination", etc.</p>
      </div>
    );
  }

  // Separate results by type
  const quantitativeResults = results.filter((r): r is QuantitativeExaminationResult => r.type === 'quantitative');
  const descriptiveResults = results.filter((r): r is DescriptiveExaminationResult => r.type === 'descriptive');

  // Filter based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'vitals':
        return { quantitative: quantitativeResults, descriptive: [] };
      case 'examinations':
        return { quantitative: [], descriptive: descriptiveResults };
      default:
        return { quantitative: quantitativeResults, descriptive: descriptiveResults };
    }
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden">
      {/* Header with tabs */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Examination Results
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Tab buttons */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({results.length})
              </button>
              {quantitativeResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('vitals')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'vitals'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Vitals ({quantitativeResults.length})
                </button>
              )}
              {descriptiveResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('examinations')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'examinations'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Examinations ({descriptiveResults.length})
                </button>
              )}
            </div>

            {/* Reset button */}
            <button 
              onClick={handleReset} 
              className="p-2 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Replay animations"
            >
              <Icon name="rotate-ccw" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Results content */}
      <div className="p-8 sm:p-10 space-y-8 sm:space-y-10">
        {filteredResults.quantitative.length > 0 && (
          <QuantitativeExaminationResults results={filteredResults.quantitative} animate={animate} />
        )}
        
        {filteredResults.descriptive.length > 0 && (
          <DescriptiveExaminationResults results={filteredResults.descriptive} animate={animate} />
        )}

        {filteredResults.quantitative.length === 0 && filteredResults.descriptive.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12">
            <p>No results in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}; 