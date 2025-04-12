import { useState, useCallback, useRef, useEffect } from 'react';
import { MinificationOptions, MinificationResult } from '../types';

export function useMinifier() {
  const [result, setResult] = useState<MinificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    // Create worker only on client-side
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('../workers/minify.worker.ts', import.meta.url), { type: 'module' });
      
      // Set up message handler
      workerRef.current.onmessage = (event) => {
        setResult(event.data);
        setIsProcessing(false);
      };
      
      // Set up error handler
      workerRef.current.onerror = (error) => {
        setResult({
          error: error.message,
          code: '',
          originalSize: 0,
          minifiedSize: 0,
        });
        setIsProcessing(false);
      };
      
      // Transfer HTML minifier to worker if available
      // @ts-ignore - We know htmlMinifier exists because it's defined in index.html
      if (window.htmlMinifier) {
        // We need to send the HTML minifier to the worker
        workerRef.current.postMessage({ 
          type: 'init', 
          // @ts-ignore - We know htmlMinifier exists because it's defined in index.html
          htmlMinifier: window.htmlMinifier.toString() 
        });
      }
    }
    
    // Clean up worker on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Rest of the code remains unchanged
  const minifyCode = useCallback(async (code: string, options: MinificationOptions) => {
    if (!code.trim()) return;
    
    setIsProcessing(true);
    
    if (workerRef.current) {
      // Use worker for processing
      workerRef.current.postMessage({ type: 'minify', code, options });
    } else {
      // Fallback if worker is not available
      try {
        // Implement fallback minification logic here
        setIsProcessing(false);
        setResult({
          error: 'Web Workers not supported in this browser',
          code,
          originalSize: new Blob([code]).size,
          minifiedSize: new Blob([code]).size,
        });
      } catch (error) {
        setIsProcessing(false);
        setResult({
          error: error instanceof Error ? error.message : String(error),
          code,
          originalSize: new Blob([code]).size,
          minifiedSize: new Blob([code]).size,
        });
      }
    }
  }, []);

  const resetResult = useCallback(() => {
    setResult(null);
  }, []);

  return { result, isProcessing, minifyCode, resetResult };
}