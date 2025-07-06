import React, { useState, useEffect } from 'react';
import { InvestigationResult } from '../types';
import { Play, RotateCcw } from 'lucide-react';

const getStatusColors = (status: InvestigationResult['status']) => {
  switch (status) {
    case 'Normal': return 'bg-green-500';
    case 'High': return 'bg-amber-500';
    case 'Low': return 'bg-blue-500';
    case 'Critical': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusBadgeColors = (status: InvestigationResult['status']) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'High': return 'bg-amber-100 text-amber-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

const Bar: React.FC<{ result: InvestigationResult; animate: boolean }> = ({ result, animate }) => {
  const { value, range, status } = result;
  const percentage = Math.min(100, Math.max(0, (value / (range.high * 1.2)) * 100)); // allow exceeding range visually

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
      <div
        className={`h-4 rounded-full ${getStatusColors(status)} transition-all duration-1000 ease-out`}
        style={{ width: animate ? `${percentage}%` : '0%' }}
      />
    </div>
  );
};

export const InvestigationResults: React.FC<{ results: InvestigationResult[] }> = ({ results }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Start animation shortly after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [results]);

  const handleReset = () => {
    setAnimate(false);
    setTimeout(() => setAnimate(true), 100);
  };
  
  if (results.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/50 p-4 rounded-lg text-center text-slate-500 dark:text-slate-400">
        <p>No investigation results available.</p>
        <p className="text-sm">Please specify investigations like "FBC", "U&E", "LFT", "Beta-hCG", etc.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg p-4 sm:p-6 rounded-xl space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Investigation Results</h3>
        <div className="flex items-center space-x-2">
          <button onClick={handleReset} className="p-2 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-5">
        {results.map((result, index) => (
          <div key={index} className="flex flex-col space-y-2 transition-opacity duration-500" style={{ transitionDelay: `${index * 100}ms`, opacity: animate ? 1 : 0 }}>
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-slate-800 dark:text-white">{result.name}</span>
              <div className="flex items-baseline space-x-2">
                <span className={`font-bold text-lg ${getStatusColors(result.status).replace('bg-', 'text-')}`}>{result.value}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{result.unit}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColors(result.status)}`}>{result.status}</span>
              </div>
            </div>
            <Bar result={result} animate={animate} />
            <div className="text-right text-xs text-slate-500">
              Ref: {result.range.low} - {result.range.high} {result.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};