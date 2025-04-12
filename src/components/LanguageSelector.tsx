import { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  detectedLanguage?: Language;
  className?: string;
}

export function LanguageSelector({ value, onChange, detectedLanguage, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get display text for current selection
  const getDisplayText = () => {
    if (value === 'auto') {
      return `Auto Detect ${detectedLanguage ? `(${detectedLanguage})` : ''}`;
    } else if (value === 'javascript') {
      return 'JavaScript';
    } else if (value === 'css') {
      return 'CSS';
    } else if (value === 'html') {
      return 'HTML';
    }
    return value;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 rounded border-2 border-gray-300 font-bold text-gray-900 transition-colors duration-300 hover:text-white hover:border-blue-700 hover:bg-blue-700"
      >
        <span>{getDisplayText()}</span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white font-bold border-2 border-gray-300 rounded-md">
          <ul className="max-h-60 overflow-auto divide-y-2">
            <li 
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === 'auto' ? 'bg-blue-100' : ''}`}
              onClick={() => { onChange('auto'); setIsOpen(false); }}
            >
              Auto Detect {detectedLanguage ? `(${detectedLanguage})` : ''}
            </li>
            <li 
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === 'javascript' ? 'bg-blue-100' : ''}`}
              onClick={() => { onChange('javascript'); setIsOpen(false); }}
            >
              JavaScript
            </li>
            <li 
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === 'css' ? 'bg-blue-100' : ''}`}
              onClick={() => { onChange('css'); setIsOpen(false); }}
            >
              CSS
            </li>
            <li 
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === 'html' ? 'bg-blue-100' : ''}`}
              onClick={() => { onChange('html'); setIsOpen(false); }}
            >
              HTML
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}