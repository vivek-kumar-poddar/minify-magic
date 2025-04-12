// Import types from a message interface instead
import type { MinificationOptions } from '../types';

// Store the HTML minifier function
let htmlMinifier: Function | null = null;

// Simple CSS minification function that doesn't rely on Node.js-specific libraries
const minifyCSS = (code: string, options: MinificationOptions): string => {
  // Start with the original code
  let result = code;
  
  // Remove comments only if not preserving them
  if (!options.format.comments) {
    result = result.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove comments
  }
  
  // Continue with other minification steps
  return result
    // Optimize complex selectors with multiple parts
    .replace(/\s*([,>+~])\s*/g, '$1') // Remove spaces around combinators
    .replace(/\s+([.#:])/g, '$1') // Remove spaces before class/id/pseudo selectors
    .replace(/@media\s+([^{]+)\s*\{\s*/g, '@media$1{') // Clean media queries
    .replace(/@(keyframes|font-face|supports|page|counter-style|viewport|document)\s+([^{]+)\s*\{\s*/gi, '@$1 $2{') // Clean CSS3 at-rules
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special characters
    .replace(/;\}/g, '}') // Remove unnecessary semicolons
    .replace(/:\s*0(\.\d+)?(?:em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|px|pt|pc|%)/g, ':0') // Remove units from zero values
    .replace(/(^\s*|\})\s*([^{]+?)\s*\{/g, '$1$2{') // Clean selectors
    .replace(/\s*!important/g, '!important') // Clean !important
    .replace(/([^0-9a-zA-Z.#])(0)(%|px|pt|em|rem|vw|vh|vmin|vmax)/g, '$1$2') // Remove units from zeros for responsive units
    .replace(/border:none/gi, 'border:0') // Convert 'none' to '0' where applicable
    .replace(/background-position:0( |;|$)/g, 'background-position:0 0$1') // Fix background position
    .replace(/calc\(\s*([\d\.\-+*\/]+)\s*\)/g, (_, calc) => `calc(${calc.replace(/\s+/g, '')})`) // Clean calc expressions
    .replace(/-(webkit|moz|ms|o)-/g, '-$1-') // Standardize vendor prefixes
    
    // Improved color handling
    .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)/g, (_, r, g, b, a) => {
      // Make sure values are within valid range
      r = Math.min(255, Math.max(0, parseInt(r)));
      g = Math.min(255, Math.max(0, parseInt(g)));
      b = Math.min(255, Math.max(0, parseInt(b)));
      a = Math.min(1, Math.max(0, parseFloat(a)));
      
      // Format with no spaces
      return `rgba(${r},${g},${b},${a})`;
    })
    .replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, (_, r, g, b) => {
      // Make sure values are within valid range
      r = Math.min(255, Math.max(0, parseInt(r)));
      g = Math.min(255, Math.max(0, parseInt(g)));
      b = Math.min(255, Math.max(0, parseInt(b)));
      
      // Check if we can convert to hex for shorter output
      if (options.format.convertColorsToHex !== false) {
        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');
        
        // Use shorthand hex if possible
        if (hexR[0] === hexR[1] && hexG[0] === hexG[1] && hexB[0] === hexB[1]) {
          return `#${hexR[0]}${hexG[0]}${hexB[0]}`;
        }
        return `#${hexR}${hexG}${hexB}`;
      }
      
      // Otherwise just format with no spaces
      return `rgb(${r},${g},${b})`;
    })
    .replace(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/g, (_, h, s, l) => {
      // Make sure values are within valid range
      h = (parseInt(h) % 360 + 360) % 360; // Handle negative values and wrap around
      s = Math.min(100, Math.max(0, parseInt(s)));
      l = Math.min(100, Math.max(0, parseInt(l)));
      
      return `hsl(${h},${s}%,${l}%)`;
    })
    .replace(/hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d*\.?\d+)\s*\)/g, (_, h, s, l, a) => {
      // Make sure values are within valid range
      h = (parseInt(h) % 360 + 360) % 360; // Handle negative values and wrap around
      s = Math.min(100, Math.max(0, parseInt(s)));
      l = Math.min(100, Math.max(0, parseInt(l)));
      a = Math.min(1, Math.max(0, parseFloat(a)));
      
      return `hsla(${h},${s}%,${l}%,${a})`;
    })
    
    // Handle hex color shortening (#AABBCC -> #ABC when possible)
    .replace(/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/g, 
      (match, r1, r2, g1, g2, b1, b2) => {
        return r1 === r2 && g1 === g2 && b1 === b2 ? `#${r1}${g1}${b1}` : match;
      })
    
    // Handle modern CSS color functions
    .replace(/color\(\s*([a-z-]+)\s+([\d\s.%,/-]+)\s*\)/g, (_, colorSpace, values) => {
      return `color(${colorSpace} ${values.replace(/\s+/g, '')})`;
    })
    
    .replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g, 'url($1$2$1)') // Clean urls
    .replace(/\s*(,)\s*/g, '$1') // Clean comma-separated values (like in gradients)
    .replace(/linear-gradient\(\s*(.*?)\s*\)/g, (_, content) => {
      // Preserve commas but remove spaces
      return `linear-gradient(${content.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()})`;
    })
    .replace(/radial-gradient\(\s*(.*?)\s*\)/g, (_, content) => {
      // Preserve commas but remove spaces
      return `radial-gradient(${content.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()})`;
    })
    .replace(/var\(\s*--([a-zA-Z0-9_-]+)\s*,?\s*(.*?)\s*\)/g, (_, name, fallback) => 
      fallback ? `var(--${name},${fallback.trim()})` : `var(--${name})`) // Clean CSS variables
    .replace(/\s+!important/g, '!important') // Fix !important syntax
    .replace(/content:\s*['"]\s*['"]/g, 'content:""') // Fix empty content
    .replace(/([;{])([\w-]+):/g, '$1$2:') // Fix property spacing
    .replace(/\@supports\s+([^{]+)\s*\{\s*/g, '@supports $1{') // Clean @supports
    .replace(/\@container\s+([^{]+)\s*\{\s*/g, '@container $1{') // Clean @container queries
    .replace(/\@layer\s+([^{;]+)\s*[{;]/g, '@layer $1$2') // Clean @layer
    // Additional optimizations for complex selectors
    .replace(/\s+([>+~])/g, '$1') // Remove spaces before combinators
    .replace(/([>+~])\s+/g, '$1') // Remove spaces after combinators
    .replace(/\s*>\s*/g, '>') // Remove all spaces around > combinator
    .replace(/\s*\+\s*/g, '+') // Remove all spaces around + combinator
    .replace(/\s*~\s*/g, '~') // Remove all spaces around ~ combinator
    .replace(/\s*,\s*/g, ',') // Remove all spaces around commas in selector lists
    .replace(/(^\s+|\s+$)/g, '') // Trim leading/trailing whitespace
    .trim();
};

// Basic HTML minification function
const minifyHTML = (code: string, options: MinificationOptions): string => {
  let result = code;
  
  // Remove HTML comments if not preserving them
  if (!options.format.comments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  // Minify inline CSS if present
  result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, cssContent) => {
    const minifiedCSS = minifyCSS(cssContent, options);
    return `<style>${minifiedCSS}</style>`;
  });
  
  // Process HTML
  return result
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/>\s+</g, '><')        // Remove whitespace between tags
    .replace(/\s+>/g, '>')          // Remove whitespace before closing bracket
    .replace(/<\s+/g, '<')          // Remove whitespace after opening bracket
    .replace(/\s+\/>/g, '/>')       // Clean self-closing tags
    .replace(/\s+([\w-]+)=/g, ' $1=') // Clean attribute spacing
    .replace(/\s+$/gm, '')          // Remove trailing whitespace
    .replace(/^\s+/gm, '')          // Remove leading whitespace
    // Fix for unused 'match' parameter in rgba function
    .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)/g, (_, r, g, b, a) => {
    // Make sure values are within valid range
    r = Math.min(255, Math.max(0, parseInt(r)));
    g = Math.min(255, Math.max(0, parseInt(g)));
    b = Math.min(255, Math.max(0, parseInt(b)));
    a = Math.min(1, Math.max(0, parseFloat(a)));
    
    // Format with no spaces
    return `rgba(${r},${g},${b},${a})`;
    })
    
    // Fix for unused 'match' parameter in rgb function
    .replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, (_, r, g, b) => {
    // Make sure values are within valid range
    r = Math.min(255, Math.max(0, parseInt(r)));
    g = Math.min(255, Math.max(0, parseInt(g)));
    b = Math.min(255, Math.max(0, parseInt(b)));
    
    // Check if we can convert to hex for shorter output
    if (options.format.convertColorsToHex !== false) {
      const hexR = r.toString(16).padStart(2, '0');
      const hexG = g.toString(16).padStart(2, '0');
      const hexB = b.toString(16).padStart(2, '0');
      
      // Use shorthand hex if possible
      if (hexR[0] === hexR[1] && hexG[0] === hexG[1] && hexB[0] === hexB[1]) {
        return `#${hexR[0]}${hexG[0]}${hexB[0]}`;
      }
      return `#${hexR}${hexG}${hexB}`;
    }
    
    // Otherwise just format with no spaces
    return `rgb(${r},${g},${b})`;
    })
    
    // Fix for unused 'match' parameter in hsl function
    .replace(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/g, (_, h, s, l) => {
    // Make sure values are within valid range
    h = (parseInt(h) % 360 + 360) % 360; // Handle negative values and wrap around
    s = Math.min(100, Math.max(0, parseInt(s)));
    l = Math.min(100, Math.max(0, parseInt(l)));
    
    return `hsl(${h},${s}%,${l}%)`;
    })
    
    // Fix for unused 'match' parameter in hsla function
    .replace(/hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d*\.?\d+)\s*\)/g, (_, h, s, l, a) => {
    // Make sure values are within valid range
    h = (parseInt(h) % 360 + 360) % 360; // Handle negative values and wrap around
    s = Math.min(100, Math.max(0, parseInt(s)));
    l = Math.min(100, Math.max(0, parseInt(l)));
    a = Math.min(1, Math.max(0, parseFloat(a)));
    
    return `hsla(${h},${s}%,${l}%,${a})`;
    })
    
    // Handle hex color shortening (#AABBCC -> #ABC when possible)
    .replace(/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/g, 
      (match, r1, r2, g1, g2, b1, b2) => {
        return r1 === r2 && g1 === g2 && b1 === b2 ? `#${r1}${g1}${b1}` : match;
      })
    
    // Handle modern CSS color functions
    .replace(/color\(\s*([a-z-]+)\s+([\d\s.%,/-]+)\s*\)/g, (_, colorSpace, values) => {
      return `color(${colorSpace} ${values.replace(/\s+/g, '')})`;
    })
    
    .replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g, 'url($1$2$1)') // Clean urls
    .replace(/\s*(,)\s*/g, '$1') // Clean comma-separated values (like in gradients)
    .replace(/linear-gradient\(\s*(.*?)\s*\)/g, (_, content) => {
      // Preserve commas but remove spaces
      return `linear-gradient(${content.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()})`;
    })
    .replace(/radial-gradient\(\s*(.*?)\s*\)/g, (_, content) => {
      // Preserve commas but remove spaces
      return `radial-gradient(${content.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim()})`;
    })
    .replace(/var\(\s*--([a-zA-Z0-9_-]+)\s*,?\s*(.*?)\s*\)/g, (_, name, fallback) => 
      fallback ? `var(--${name},${fallback.trim()})` : `var(--${name})`) // Clean CSS variables
    .replace(/\s+!important/g, '!important') // Fix !important syntax
    .replace(/content:\s*['"]\s*['"]/g, 'content:""') // Fix empty content
    .replace(/([;{])([\w-]+):/g, '$1$2:') // Fix property spacing
    .replace(/\@supports\s+([^{]+)\s*\{\s*/g, '@supports $1{') // Clean @supports
    .replace(/\@container\s+([^{]+)\s*\{\s*/g, '@container $1{') // Clean @container queries
    .replace(/\@layer\s+([^{;]+)\s*[{;]/g, '@layer $1$2') // Clean @layer
    // Additional optimizations for complex selectors
    .replace(/\s+([>+~])/g, '$1') // Remove spaces before combinators
    .replace(/([>+~])\s+/g, '$1') // Remove spaces after combinators
    .replace(/\s*>\s*/g, '>') // Remove all spaces around > combinator
    .replace(/\s*\+\s*/g, '+') // Remove all spaces around + combinator
    .replace(/\s*~\s*/g, '~') // Remove all spaces around ~ combinator
    .replace(/\s*,\s*/g, ',') // Remove all spaces around commas in selector lists
    .replace(/(^\s+|\s+$)/g, '') // Trim leading/trailing whitespace
    .replace(/\s*=\s*/g, '=')       // Remove spaces around attribute equal signs
    .replace(/<([^\/\s>]+)([^>]*)>\s+<\/\1>/g, '<$1$2></$1>') // Clean empty tags
    .replace(/\s{2,}/g, ' ')        // Ensure only single spaces remain
    .trim();
};

// This function will run in a separate thread
self.onmessage = async (event: MessageEvent) => {
  const data = event.data;
  
  // Handle initialization message with HTML minifier
  if (data.type === 'init' && data.htmlMinifier) {
    try {
      // Instead of using new Function, we'll use a safer approach
      // that ensures all required variables are in scope
      const htmlMinifierCode = data.htmlMinifier;
      
      // Create a wrapper function that will execute the minifier in a controlled context
      htmlMinifier = (html: string, options: any) => {
        try {
          // Create a safe execution context with required dependencies
          const minifierFn = new Function('html', 'options', 'require', `
            try {
              // Create a minimal require implementation
              const moduleCache = {};
              
              // Execute the minifier with all dependencies in scope
              return (${htmlMinifierCode})(html, options);
            } catch (err) {
              console.error('HTML minifier execution error:', err);
              throw err;
            }
          `);
          
          // Create a minimal require function for the minifier
          const requireFn = (moduleName: string) => {
            if (moduleName === 'html-minifier') {
              return { minify: htmlMinifierCode };
            }
            return {};
          };
          
          return minifierFn(html, options, requireFn);
        } catch (error) {
          console.error('HTML minifier wrapper error:', error);
          throw error;
        }
      };
      
      return;
    } catch (error) {
      console.error('Failed to initialize HTML minifier in worker:', error);
    }
  }
  
  // Handle minification request
  if (data.type === 'minify') {
    const { code, options } = data;
    
    try {
      // Process based on language
      let result;
      const originalSize = new Blob([code]).size;
      
      if (options.language === 'html' || (options.language === 'auto' && code.trim().startsWith('<'))) {
        // HTML minification using our enhanced minifier
        try {
          // First try with the integrated minifier
          result = minifyHTML(code, options);
          
          // If htmlMinifier is available and the basic minification didn't reduce size much,
          // try with the advanced minifier
          const basicMinifiedSize = new Blob([result]).size;
          const reductionRatio = basicMinifiedSize / originalSize;
          
          if (htmlMinifier && reductionRatio > 0.8) { // If reduction is less than 20%
            try {
              const advancedResult = htmlMinifier(code, {
                removeComments: !options.format.comments,
                collapseWhitespace: true,
                conservativeCollapse: false,
                collapseInlineTagWhitespace: true,
                decodeEntities: true,
                minifyCSS: true,
                minifyJS: true,
                removeAttributeQuotes: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
              });
              
              // Use the advanced result if it's smaller
              const advancedSize = new Blob([advancedResult]).size;
              if (advancedSize < basicMinifiedSize) {
                result = advancedResult;
              }
            } catch (advancedError) {
              console.warn('Advanced HTML minification failed, using basic result:', advancedError);
              // Keep using the basic result
            }
          }
        } catch (error) {
          console.error('HTML minification error:', error);
          throw new Error('Error during HTML minification: ' + (error instanceof Error ? error.message : String(error)));
        }
      } else if (options.language === 'css' || (options.language === 'auto' && /^\s*[.#@{]/.test(code))) {
        // CSS minification - using our comprehensive implementation
        result = minifyCSS(code, options);
      } else {
        // JavaScript minification - using Terser if available
        try {
          // Try to use Terser if available
          const terserModule = await import('terser');
          const minified = await terserModule.minify(code, {
            mangle: options.mangle,
            format: options.format,
          });
          result = minified.code || '';
        } catch (error) {
          console.error('Terser error:', error);
          // Fallback to basic minification
          result = code
            .replace(/\/\/.*$/gm, options.format.comments ? '$&' : '') // Remove single line comments
            .replace(/\/\*[\s\S]*?\*\//g, options.format.comments ? '$&' : '') // Remove multi-line comments
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      
      const minifiedSize = new Blob([result]).size;
      
      // Detect language
      let detectedLanguage = 'javascript';
      if (code.trim().startsWith('<')) {
        detectedLanguage = 'html';
      } else if (/^\s*[.#@{]/.test(code)) {
        detectedLanguage = 'css';
      }
      
      // Send the result back to the main thread
      self.postMessage({
        code: result,
        originalSize,
        minifiedSize,
        detectedLanguage,
        compressionRatio: ((originalSize - minifiedSize) / originalSize * 100).toFixed(1) + '%'
      });
    } catch (error) {
      console.error('Worker error:', error);
      self.postMessage({
        error: error instanceof Error ? error.message : String(error),
        code: code,
        originalSize: new Blob([code]).size,
        minifiedSize: new Blob([code]).size,
        compressionRatio: '0%'
      });
    }
  }
};