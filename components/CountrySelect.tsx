'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { SORTED_COUNTRIES, Country } from '../lib/countries';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  placeholder = "Choose your country...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Filter countries based on search term
  const filteredCountries = SORTED_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCountry = SORTED_COUNTRIES.find(country => country.name === value);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Focus the search input when opening
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else {
        setSearchTerm('');
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-500'
        }`}
      >
        <span className={selectedCountry ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
          {selectedCountry ? selectedCountry.name : placeholder}
        </span>
        <Icon 
          name="chevron-down" 
          size={16} 
          className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Icon 
                name="search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" 
              />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-10 pr-3 py-2 text-base md:text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Countries list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    country.name === value 
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' 
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {country.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
