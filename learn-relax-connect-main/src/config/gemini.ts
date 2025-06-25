interface GeminiConfig {
  apiKey: string;
}

// In Vite, we use import.meta.env instead of process.env
export const geminiConfig: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY'
}; 