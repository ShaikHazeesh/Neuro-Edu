// Note: Make sure to run 'npm install @google/generative-ai' before using this service
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GeminiConfig {
  apiKey: string;
}

interface ChatResponse {
  text: string;
  type: 'info' | 'error' | 'success';
}

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string;
  private model: any;

  private constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = config.apiKey;
  }

  public static initialize(config: GeminiConfig) {
    if (!GeminiService.instance) {
      if (!config.apiKey) {
        console.error('Gemini API key is missing. Mental health support will be limited.');
        return null;
      }
      GeminiService.instance = new GeminiService(config);
    }
    return GeminiService.instance;
  }

  private async initializeModel() {
    if (!this.model) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
      } catch (error) {
        console.error('Failed to initialize Gemini model:', error);
        throw new Error('Failed to initialize AI model');
      }
    }
    return this.model;
  }

  private async generateMentalHealthResponse(prompt: string): Promise<string> {
    try {
      const model = await this.initializeModel();
      const result = await model.generateContent(`
        You are a supportive and empathetic mental health chatbot assistant. 
        Your role is to provide helpful information and support while being mindful of the following:
        
        1. Always maintain a compassionate and non-judgmental tone
        2. Encourage professional help when appropriate
        3. Never provide medical diagnoses or treatment recommendations
        4. Focus on general wellness and coping strategies
        5. Include crisis hotline information when conversations indicate distress
        
        User message: ${prompt}
      `);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  public static async getMentalHealthResponse(userInput: string): Promise<ChatResponse> {
    try {
      if (!GeminiService.instance) {
        return {
          text: "Mental health support is currently unavailable. Please try again later or contact a mental health professional directly.",
          type: 'error'
        };
      }

      const response = await GeminiService.instance.generateMentalHealthResponse(userInput);
      
      return {
        text: response,
        type: 'success'
      };
    } catch (error) {
      console.error('Mental health response error:', error);
      
      return {
        text: `I apologize, but I'm currently unable to provide a complete response. 
        If you're feeling distressed, please consider:
        
        1. Contacting a mental health professional
        2. Reaching out to a trusted friend or family member
        3. Calling a mental health crisis hotline:
           - National Crisis Hotline (US): 988
           - Crisis Text Line: Text HOME to 741741
        
        Your well-being is important, and it's okay to ask for help.`,
        type: 'info'
      };
    }
  }
} 