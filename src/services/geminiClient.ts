import { GoogleGenAI, Type } from '@google/genai';

export function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('CUSTOM_GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error("API key is missing. Please ensure it is set as an environment variable or in Settings.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateWithFallback(options: {
  contents: any;
  config?: any;
  jsonSchema?: any;
}) {
  const ai = getAI();
  const config = { ...options.config };
  
  if (options.jsonSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = options.jsonSchema;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: options.contents,
      config,
    });
    return response;
  } catch (err: any) {
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("gemini-3-flash-preview failed, falling back to gemini-2.5-flash");
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: options.contents,
        config,
      });
    }
    throw err;
  }
}

export async function generateStreamWithFallback(options: {
  contents: any;
  config?: any;
  onChunk: (text: string) => void;
}) {
  const ai = getAI();
  let fullText = '';
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
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
    if (err.message?.includes('403') || err.message?.includes('PERMISSION_DENIED') || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("gemini-3-flash-preview failed, falling back to gemini-2.5-flash");
      const fallbackStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: options.contents,
        config: options.config,
      });
      for await (const chunk of fallbackStream) {
        if (chunk.text) {
          fullText += chunk.text;
          options.onChunk(fullText);
        }
      }
      return fullText;
    }
    throw err;
  }
}
