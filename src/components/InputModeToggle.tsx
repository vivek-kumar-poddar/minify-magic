import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { InputMode } from '../types';

interface InputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onFileSelect: (file: File) => void;
}

export function InputModeToggle({ mode, onModeChange, onFileSelect }: InputModeToggleProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onModeChange({ type: 'file', filename: file.name });
      onFileSelect(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      onModeChange({ type: 'file', filename: file.name });
      onFileSelect(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          onModeChange({ type: 'file', filename: file.name });
          onFileSelect(file);
          break;
        }
      }
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {mode.type === 'file' && (
        <div 
          className={`mt-4 p-8 border-2 border-dashed rounded-[3px] w-full flex items-center justify-center ${
            mode.filename ? 'bg-blue-50 border-blue-200' : 'cursor-pointer hover:border-blue-300'
          } ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-100'
          } transition-colors duration-300`}
          style={{ minHeight: '256px' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={!mode.filename ? handleUploadAreaClick : undefined}
        >
          <div className="text-center">
            <Upload className={`w-8 h-8 mx-auto ${mode.filename ? 'text-blue-600' : 'text-blue-400'}`} />
            <p className={`mt-4 text-sm ${mode.filename ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
              {mode.filename 
                ? `Selected: ${mode.filename}` 
                : "Drag & drop file, paste, or click to browse"}
            </p>
            {!mode.filename && (
              <p className="text-xs text-gray-500 mt-2">Supports: .js, .css, .html, .txt</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".js,.css,.html,.txt"
            onChange={handleFileChange}
            className="hidden"
            key={mode.filename || 'file-input-key'} 
          />
        </div>
      )}
    </div>
  );
}