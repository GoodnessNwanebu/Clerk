import React, { useEffect, useState } from 'react';
import { Department, Subspecialty } from '../../types';
import { Icon } from '../Icon';

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
  isSelected: boolean;
}> = ({ subspecialty, onClick, disabled, isSelected }) => {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`relative rounded-lg p-3 text-white overflow-hidden group transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
      } bg-gradient-to-br ${subspecialty.gradient}`}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-bold text-white text-left">{subspecialty.name}</h3>
          <p className="text-white/90 text-xs mt-1 text-left">{subspecialty.description}</p>
        </div>
        <div className="ml-2 mt-0.5">
          <div className={`w-5 h-5 rounded border-2 border-white flex items-center justify-center ${
            isSelected ? 'bg-white' : 'bg-transparent'
          }`}>
            {isSelected && <Icon name="check" size={12} className="text-slate-800" />}
          </div>
        </div>
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
  const [selectedSubspecialties, setSelectedSubspecialties] = useState<string[]>([]);
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

  const handleSubspecialtyToggle = (subspecialty: Subspecialty) => {
    if (disabled) return;
    
    setSelectedSubspecialties(prev => {
      if (prev.includes(subspecialty.name)) {
        return prev.filter(name => name !== subspecialty.name);
      } else {
        return [...prev, subspecialty.name];
      }
    });
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const allSubspecialtyNames = department.subspecialties?.map(sub => sub.name) || [];
    if (selectedSubspecialties.length === allSubspecialtyNames.length) {
      setSelectedSubspecialties([]);
    } else {
      setSelectedSubspecialties(allSubspecialtyNames);
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
        
        {/* Select All Button */}
        <div className="mb-4">
          <button
            onClick={handleSelectAll}
            disabled={disabled}
            className={`w-full p-3 rounded-lg border-2 border-dashed transition-all duration-300 ${
              disabled 
                ? 'opacity-50 cursor-not-allowed border-slate-300 dark:border-slate-600' 
                : 'border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedSubspecialties.length === (department.subspecialties?.length || 0)
                    ? 'bg-teal-500 border-teal-500'
                    : selectedSubspecialties.length > 0
                    ? 'bg-teal-500/50 border-teal-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selectedSubspecialties.length > 0 && (
                    <Icon 
                      name="check" 
                      size={12} 
                      className={selectedSubspecialties.length === (department.subspecialties?.length || 0) ? 'text-white' : 'text-white/70'} 
                    />
                  )}
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Select All</span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {selectedSubspecialties.length}/{department.subspecialties?.length || 0}
              </span>
            </div>
          </button>
        </div>

        {/* Subspecialties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {department.subspecialties?.map((subspecialty) => (
            <SubspecialtyCard
              key={subspecialty.name}
              subspecialty={subspecialty}
              onClick={() => handleSubspecialtyToggle(subspecialty)}
              disabled={disabled}
              isSelected={selectedSubspecialties.includes(subspecialty.name)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              if (selectedSubspecialties.length > 0) {
                // For now, just select the first one - will be enhanced later for multiple selection
                const firstSelected = department.subspecialties?.find(sub => selectedSubspecialties.includes(sub.name));
                if (firstSelected) {
                  onSelectSubspecialty(firstSelected);
                  onClose();
                }
              }
            }}
            disabled={disabled || selectedSubspecialties.length === 0}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              disabled || selectedSubspecialties.length === 0
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            Start Case {selectedSubspecialties.length > 0 && `(${selectedSubspecialties.length} selected)`}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
            Select subspecialties to start your case in those specific areas of {department.name}.
          </p>
        </div>
      </div>
    </div>
  );
}; 