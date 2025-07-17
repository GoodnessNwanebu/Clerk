import React, { useState, useEffect } from 'react';
import { InvestigationResult, QuantitativeResult, DescriptiveResult } from '../types';
import { Icon } from './Icon';

// Utility functions
const getStatusColors = (status: QuantitativeResult['status']) => {
  switch (status) {
    case 'Normal': return 'bg-green-500';
    case 'High': return 'bg-amber-500';
    case 'Low': return 'bg-blue-500';
    case 'Critical': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusBadgeColors = (status: QuantitativeResult['status']) => {
  switch (status) {
    case 'Normal': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'High': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getUrgencyColors = (urgency: InvestigationResult['urgency']) => {
  switch (urgency) {
    case 'critical': return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
    case 'urgent': return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10';
    default: return 'border-l-slate-300 dark:border-l-slate-600';
  }
};

const getReportIcon = (reportType: DescriptiveResult['reportType']) => {
  switch (reportType) {
    case 'radiology': return 'search';
    case 'pathology': return 'lightbulb';
    case 'ecg': return 'heart';
    case 'echo': return 'heart';
    case 'specialist': return 'user';
    default: return 'alert-circle';
  }
};

// Quantitative result bar component
const QuantitativeBar: React.FC<{ result: QuantitativeResult; animate: boolean }> = ({ result, animate }) => {
  const { value, range, status } = result;
  const percentage = Math.min(100, Math.max(0, (value / (range.high * 1.2)) * 100));

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 sm:h-4">
      <div
        className={`h-3 sm:h-4 rounded-full ${getStatusColors(status)} transition-all duration-1000 ease-out`}
        style={{ width: animate ? `${percentage}%` : '0%' }}
      />
    </div>
  );
};

// Quantitative results section
const QuantitativeResults: React.FC<{ results: QuantitativeResult[]; animate: boolean }> = ({ results, animate }) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
        <Icon name="award" size={20} className="text-teal-500" />
        <span>Laboratory Results</span>
      </h4>
      <div className="space-y-6 sm:space-y-8">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`border-l-4 pl-6 sm:pl-8 py-4 sm:py-6 transition-all duration-500 ${getUrgencyColors(result.urgency)}`}
            style={{ transitionDelay: `${index * 100}ms`, opacity: animate ? 1 : 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline space-y-3 sm:space-y-0">
              <span className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg">{result.name}</span>
              <div className="flex flex-col sm:flex-row sm:items-baseline space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex items-baseline space-x-2">
                  <span className={`font-bold text-xl sm:text-2xl ${getStatusColors(result.status).replace('bg-', 'text-')}`}>
                    {result.value}
                  </span>
                  <span className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{result.unit}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusBadgeColors(result.status)} self-start sm:self-auto`}>
                  {result.status}
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-5">
              <QuantitativeBar result={result} animate={animate} />
            </div>
            <div className="text-right text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 sm:mt-4">
              Ref: {result.range.low} - {result.range.high} {result.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Descriptive results section
const DescriptiveResults: React.FC<{ results: DescriptiveResult[]; animate: boolean }> = ({ results, animate }) => {
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
        <Icon name="search" size={20} className="text-emerald-500" />
        <span>Imaging & Reports</span>
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
                        name={getReportIcon(result.reportType)} 
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
export const InvestigationResults: React.FC<{ results: InvestigationResult[] }> = ({ results }) => {
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'laboratory' | 'reports'>('all');

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
        <Icon name="search" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <p className="text-lg sm:text-xl font-medium mb-3">No investigation results available.</p>
        <p className="text-sm sm:text-base">Please specify investigations like "FBC", "U&E", "Chest X-ray", "Ultrasound", etc.</p>
      </div>
    );
  }

  // Separate results by type
  const quantitativeResults = results.filter((r): r is QuantitativeResult => r.type === 'quantitative');
  const descriptiveResults = results.filter((r): r is DescriptiveResult => r.type === 'descriptive');

  // Filter based on active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'laboratory':
        return { quantitative: quantitativeResults, descriptive: [] };
      case 'reports':
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
            Investigation Results
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
                  onClick={() => setActiveTab('laboratory')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'laboratory'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Labs ({quantitativeResults.length})
                </button>
              )}
              {descriptiveResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Reports ({descriptiveResults.length})
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
          <QuantitativeResults results={filteredResults.quantitative} animate={animate} />
        )}
        
        {filteredResults.descriptive.length > 0 && (
          <DescriptiveResults results={filteredResults.descriptive} animate={animate} />
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