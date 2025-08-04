import React from 'react';
import { Icon } from './Icon';

interface RetryStatusIndicatorProps {
  status: 'idle' | 'loading' | 'retrying' | 'success' | 'error';
  operation: string;
  retryCount?: number;
  maxRetries?: number;
  message?: string;
  onDismiss?: () => void;
}

export const RetryStatusIndicator: React.FC<RetryStatusIndicatorProps> = ({ 
  status, 
  operation,
  retryCount = 0,
  maxRetries = 3,
  message,
  onDismiss
}) => {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: 'loader-2',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: `${operation}...`
        };
      case 'retrying':
        return {
          icon: 'refresh-cw',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          text: `Retrying ${operation}... (${retryCount}/${maxRetries})`
        };
      case 'success':
        return {
          icon: 'check-circle',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: `${operation} completed successfully!`
        };
      case 'error':
        return {
          icon: 'alert-triangle',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: `Failed to ${operation.toLowerCase()}`
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
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} shadow-lg z-50 max-w-sm transition-all duration-300`}>
      <div className="flex items-center space-x-3">
        <Icon 
          name={config.icon as any} 
          className={`${config.color} ${status === 'loading' || status === 'retrying' ? 'animate-spin' : ''}`} 
          size={20}
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">
            {config.text}
          </p>
          {message && status !== 'retrying' && (
            <p className="text-xs text-slate-600 mt-1">
              {message}
            </p>
          )}
          {status === 'retrying' && (
            <div className="mt-2">
              <div className="w-full bg-slate-200 rounded-full h-1">
                <div 
                  className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        {onDismiss && (status === 'success' || status === 'error') && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}; 