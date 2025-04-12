import { useState, useCallback, lazy, Suspense, useRef, useEffect } from 'react';
import { MinificationOptions, Language, InputMode } from './types';
import { Download, Copy, Loader2, RefreshCw, CheckCheck, Settings } from 'lucide-react';
import { useMinifier } from './hooks/useMinifier';

// Lazy load components
const CodeEditor = lazy(() => import('./components/CodeEditor').then(module => ({ default: module.CodeEditor })));
const InputModeToggle = lazy(() => import('./components/InputModeToggle').then(module => ({ default: module.InputModeToggle })));
const LanguageSelector = lazy(() => import('./components/LanguageSelector').then(module => ({ default: module.LanguageSelector })));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

function App() {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<MinificationOptions>({
    mangle: true,
    format: {
      comments: false,
    },
    language: 'auto',
  });
  const [inputMode, setInputMode] = useState<InputMode>({ type: 'text' });
  const { result, isProcessing, minifyCode, resetResult } = useMinifier();
  const [isCopied, setIsCopied] = useState(false);
  // Add state for modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsModalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsModalRef.current && !settingsModalRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleFileSelect = useCallback(async (file: File) => {
    const text = await file.text();
    setInput(text);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension) {
      const languageMap: Record<string, Language> = {
        js: 'javascript',
        css: 'css',
        html: 'html',
        txt: 'auto',
      };
      setOptions(prev => ({
        ...prev,
        language: languageMap[extension] || 'auto',
      }));
    }
  }, []);

  const handleSwitchToUpload = () => {
    setInputMode({ type: 'file', filename: '' });
  };

  const handleSwitchToText = () => {
    setInputMode({ type: 'text' });
  };

  const handleMinify = async () => {
    if (!input.trim()) return;
    await minifyCode(input, options);
  };

  const handleCopy = async () => {
    if (result?.code) {
      await navigator.clipboard.writeText(result.code);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const handleDownload = () => {
    if (result?.code) {
      const blob = new Blob([result.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minified${inputMode.filename ? `-${inputMode.filename}` : '.txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setInput('');
    setInputMode({ type: 'text' });
    resetResult(); // Use the resetResult function from the hook
  };

  // Toggle settings modal
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Minifier</h1>
          <p className="text-gray-600">Optimize your code with our advanced minification tool</p>
        </div>

        {/* Input Section */}
        <div className="text-sm border-2">
          <div className="p-6 space-y-6">
            {/* Top Controls - Language selector and input mode toggle */}
            <div className="flex justify-between items-center">
              <Suspense fallback={<div className="w-40 h-10 bg-gray-100 rounded animate-pulse"></div>}>
                <LanguageSelector
                  value={options.language}
                  onChange={(language) => setOptions({ ...options, language })}
                  detectedLanguage={result?.detectedLanguage}
                />
              </Suspense>
              
              <button
                onClick={inputMode.type === 'text' ? handleSwitchToUpload : handleSwitchToText}
                className={`px-3 py-2 rounded border-2 border-gray-300 font-bold text-gray-900 transition-colors duration-300 ${
                  inputMode.type === 'text' 
                    ? 'hover:text-white hover:border-blue-700 hover:bg-blue-700' 
                    : 'hover:text-white hover:border-blue-700 hover:bg-blue-700'
                }`}
                title={inputMode.type === 'text' ? "Switch to File Upload" : "Switch to Text Input"}
              >
                {inputMode.type === 'text' ? (
                  <>
                    <span>Upload?</span>
                  </>
                ) : (
                  <>
                    <span>Input?</span>
                  </>
                )}
              </button>
            </div>

            {/* Input Area with Suspense for lazy loading */}
            <div>
              <Suspense fallback={<LoadingFallback />}>
                {inputMode.type === 'text' ? (
                  <CodeEditor
                    value={input}
                    onChange={setInput}
                    placeholder="Paste your code here..."
                  />
                ) : (
                  <InputModeToggle
                    mode={inputMode}
                    onModeChange={setInputMode}
                    onFileSelect={handleFileSelect}
                  />
                )}
              </Suspense>
            </div>

            {/* Bottom Controls - Settings button and Minify button */}
            <div className="flex justify-between items-center">
              <div className="relative">
                <button
                  onClick={toggleSettings}
                  title="Minification Settings"
                  className={`p-2 rounded-md focus:outline-none focus:ring-none transition-colors duration-200 ${
                    isSettingsOpen 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {/* Settings Modal */}
                {isSettingsOpen && (
                  <div 
                    ref={settingsModalRef}
                    className="absolute z-20 mt-1 p-4 text-white bg-blue-600 rounded-md border-2 border-blue-600 min-w-[200px] animate-fade-in"
                  >
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-white border-b-2 border-blue-700 px-4 pb-2 -mt-2 -mx-4">Minification Settings</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="mangle"
                          checked={options.mangle}
                          onChange={(e) => setOptions({ ...options, mangle: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="mangle" className="text-sm">Mangle</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="comments"
                          checked={options.format.comments}
                          onChange={(e) => setOptions({
                            ...options,
                            format: { ...options.format, comments: e.target.checked }
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="comments" className="text-sm">Keep comments</label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  title="Reset input"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleMinify}
                  disabled={isProcessing || !input.trim()}
                  className="px-3 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    'Minify'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section - Only visible after minification */}
        {result && (
          <div className="text-sm">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Output</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded border-2 border-gray-300 font-bold text-gray-900 transition-colors duration-300 hover:text-white hover:border-blue-700 hover:bg-blue-700 flex items-center"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Done
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-2 rounded border-2 border-gray-300 font-bold text-gray-900 transition-colors duration-300 hover:text-white hover:border-blue-700 hover:bg-blue-700 flex items-center"
                    title="Download minified file"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
              
              <div id="output-stats" className="bg-blue-50 p-4 rounded border-2 border-blue-100 flex flex-wrap justify-between">
                <div className="w-1/2 sm:w-auto mb-4 sm:mb-0">
                  <p className="text-sm text-gray-500">Original size</p>
                  <p className="text-lg font-semibold text-gray-900">{(result.originalSize / 1024).toFixed(2)} KB</p>
                </div>
                <div className="w-1/2 sm:w-auto mb-4 sm:mb-0">
                  <p className="text-sm text-gray-500">Minified size</p>
                  <p className="text-lg font-semibold text-gray-900">{(result.minifiedSize / 1024).toFixed(2)} KB</p>
                </div>
                <div className="w-full sm:w-auto mt-2 sm:mt-0">
                  <p className="text-sm text-gray-500">Reduction</p>
                  <p className="text-lg font-semibold text-green-600">
                    {result.minifiedSize >= result.originalSize ? 
                      "Code is already optimized" : 
                      ((1 - result.minifiedSize / result.originalSize) * 100).toFixed(1) + "%"}
                  </p>
                </div>
              </div>

              <div>
                <Suspense fallback={<LoadingFallback />}>
                  <CodeEditor
                    value={result.minifiedSize >= result.originalSize ? input : result.code}
                    onChange={() => {}}
                    error={result.error}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;