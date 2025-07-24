import React, { useEffect } from 'react';
import { Department, Subspecialty } from '../types';
import { Icon } from './Icon';

interface SubspecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
  onSelectSubspecialty: (subspecialty: Subspecialty) => void;
  disabled?: boolean;
}

const SubspecialtyCard: React.FC<{ 
  subspecialty: Subspecialty; 
  onClick: () => void;
  disabled: boolean;
}> = ({ subspecialty, onClick, disabled }) => {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`relative rounded-lg p-3 text-white overflow-hidden group transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
      } bg-gradient-to-br ${subspecialty.gradient}`}
    >
      <div className="relative z-10">
        <h3 className="text-base font-bold text-white">{subspecialty.name}</h3>
        <p className="text-white/90 text-xs mt-1">{subspecialty.description}</p>
      </div>
      <div className={`absolute inset-0 bg-black/20 ${!disabled && 'group-hover:bg-black/10'} transition-colors duration-300`}></div>
    </button>
  );
};

export const SubspecialtyModal: React.FC<SubspecialtyModalProps> = ({ 
  isOpen, 
  onClose, 
  department, 
  onSelectSubspecialty,
  disabled = false 
}) => {
  // Close modal with Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleSubspecialtySelect = (subspecialty: Subspecialty) => {
    if (!disabled) {
      onSelectSubspecialty(subspecialty);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subspecialty-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all animate-in fade-in-0 zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 id="subspecialty-title" className="text-xl font-bold">{department.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Choose a subspecialty</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close subspecialty selection"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        
        {/* Subspecialties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {department.subspecialties?.map((subspecialty) => (
            <SubspecialtyCard
              key={subspecialty.name}
              subspecialty={subspecialty}
              onClick={() => handleSubspecialtySelect(subspecialty)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Select a subspecialty to start your case in that specific area of {department.name}.
          </p>
        </div>
      </div>
    </div>
  );
}; 