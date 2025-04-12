import { LanguageSelector } from './LanguageSelector';
import { Language } from '../types';
import { Upload } from 'lucide-react';

interface ActionBarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  detectedLanguage?: Language;
  onFileUpload: (file: File) => void;
}

export function ActionBar({ 
  language, 
  onLanguageChange, 
  detectedLanguage, 
  onFileUpload 
}: ActionBarProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="flex justify-between items-center w-full mb-4">
      <LanguageSelector 
        value={language} 
        onChange={onLanguageChange} 
        detectedLanguage={detectedLanguage} 
      />
      
      <label className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer">
        <Upload className="w-4 h-4 mr-2" />
        <span>Upload File</span>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleFileChange}
          accept=".js,.css,.html,.txt"
        />
      </label>
    </div>
  );
}