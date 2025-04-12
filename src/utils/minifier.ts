import { minify } from 'terser';
import type { MinificationResult, MinificationOptions } from '../types';

export async function minifyCode(code: string, options: MinificationOptions): Promise<MinificationResult> {
  try {
    const originalSize = new Blob([code]).size;
    
    const result = await minify(code, {
      compress: true, // Always compress
      mangle: options.mangle,
      format: {
        comments: options.format.comments,
      },
    });

    if (!result.code) {
      throw new Error('Minification resulted in empty code');
    }

    const minifiedSize = new Blob([result.code]).size;

    return {
      code: result.code,
      map: result.map ? (typeof result.map === 'string' ? result.map : JSON.stringify(result.map)) : undefined,
      originalSize,
      minifiedSize,
    };
  } catch (error) {
    return {
      code: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalSize: 0,
      minifiedSize: 0,
    };
  }
}