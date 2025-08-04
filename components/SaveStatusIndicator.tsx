import React from 'react';
import { Icon } from './Icon';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'success' | 'retrying' | 'failed';
  message?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ 
  status, 
  message 
}) => {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: 'loader-2',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Saving case...'
        };
      case 'success':
        return {
          icon: 'check-circle',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Case saved successfully!'
        };
      case 'retrying':
        return {
          icon: 'refresh-cw',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          text: 'Retrying save...'
        };
      case 'failed':
        return {
          icon: 'alert-triangle',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Save failed, retrying in background'
        };
      default:
        return {
          icon: 'info',
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          text: message || 'Processing...'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg z-50 max-w-sm`}>
      <div className="flex items-center space-x-3">
        <Icon 
          name={config.icon as any} 
          className={`${config.color} ${status === 'saving' || status === 'retrying' ? 'animate-spin' : ''}`} 
          size={20}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">
            {config.text}
          </p>
          {message && (
            <p className="text-xs text-slate-600 mt-1">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 