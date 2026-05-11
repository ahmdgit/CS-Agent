import { GoogleGenAI, Type } from '@google/genai';
import { getApiKeyManager } from './apiKeyManager';

let apiKeyManager = getApiKeyManager();

export function getAI() {
  const apiKey = apiKeyManager.getKey();
  if (!apiKey) {
    throw new Error("API key is missing. Please ensure it is set as an environment variable or in Settings.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Get API key manager for quota management
 */
export function getApiKeyManager_() {
  return apiKeyManager;
}

/**
 * Reload API keys (useful if they change in settings)
 */
export function reloadApiKeys() {
  apiKeyManager = getApiKeyManager();
}

export async function generateWithFallback(options: {
  contents: any;
  config?: any;
  jsonSchema?: any;
}) {
  const config = { ...options.config };
  
  if (options.jsonSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = options.jsonSchema;
  }

  const models = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
  let lastError: any = null;

  // Try each model with fallback to next API key
  for (const model of models) {
    let apiAttempts = 0;
    while (apiAttempts < apiKeyManager.getStatus().totalKeys + 1) {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const isQuotaError = apiKeyManager.isQuotaError(err);
        const statusCode = err.message?.match(/\d{3}/)?.[0];

        if (isQuotaError) {
          console.warn(
            `⚠️ Quota exceeded with current key. ${statusCode ? `(${statusCode})` : ''}`
          );
          try {
            apiKeyManager.switchToNextKey(err.message);
            apiAttempts++;
            continue; // Retry with next key
          } catch (switchErr: any) {
            console.error('❌ No more API keys available:', switchErr.message);
            throw switchErr;
          }
        }

        // Not a quota error, throw immediately
        throw err;
      }
    }
  }

  // All attempts failed
  throw lastError || new Error('Failed to generate content with all available keys and models');
}

export async function generateStreamWithFallback(options: {
  contents: any;
  config?: any;
  onChunk: (text: string) => void;
}) {
  const models = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
  let lastError: any = null;

  // Try each model with fallback to next API key
  for (const model of models) {
    let apiAttempts = 0;
    while (apiAttempts < apiKeyManager.getStatus().totalKeys + 1) {
      try {
        const ai = getAI();
        let fullText = '';
        
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: options.contents,
          config: options.config,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            options.onChunk(fullText);
          }
        }
        return fullText;
      } catch (err: any) {
        lastError = err;
        const isQuotaError = apiKeyManager.isQuotaError(err);
        const statusCode = err.message?.match(/\d{3}/)?.[0];

        if (isQuotaError) {
          console.warn(
            `⚠️ Quota exceeded with current key during stream. ${statusCode ? `(${statusCode})` : ''}`
          );
          try {
            apiKeyManager.switchToNextKey(err.message);
            apiAttempts++;
            continue; // Retry with next key
          } catch (switchErr: any) {
            console.error('❌ No more API keys available:', switchErr.message);
            throw switchErr;
          }
        }

        // Not a quota error, throw immediately
        throw err;
      }
    }
  }

  // All attempts failed
  throw lastError || new Error('Failed to stream content with all available keys and models');
}
