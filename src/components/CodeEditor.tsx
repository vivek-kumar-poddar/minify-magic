import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function CodeEditor({ value, onChange, placeholder, error }: CodeEditorProps) {
  return (
    <div className="relative w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-64 px-4 py-4 font-mono text-sm bg-gray-50 border-2 rounded-lg focus:ring-none outline-none transition-all duration-200 ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      />
      {error && (
        <div className="mt-2 flex items-center text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}