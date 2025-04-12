export type Language = 'auto' | 'javascript' | 'css' | 'html';

export interface MinificationResult {
  code: string;
  map?: string;
  error?: string;
  originalSize: number;
  minifiedSize: number;
  detectedLanguage?: Language;
}

export interface MinificationOptions {
  mangle: boolean;
  format: {
    comments: boolean;
    convertColorsToHex?: boolean; // Add this optional property
  };
  language: Language;
}

export interface InputMode {
  type: 'text' | 'file';
  filename?: string;
}