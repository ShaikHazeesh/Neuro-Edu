import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Loader2 } from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with configuration
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",  // Updated to use Gemini 1.5
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,  // Increased token limit for Gemini 1.5
  },
});

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your mental health support assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if API key is configured
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Generate response using Gemini
      const prompt = `
        You are a supportive and empathetic mental health chatbot assistant for students.
        Your role is to provide helpful information and support while:
        1. Maintaining a compassionate and non-judgmental tone
        2. Encouraging professional help when appropriate
        3. Never providing medical diagnoses
        4. Focusing on student wellness and coping strategies
        5. Including crisis hotline information if needed
        6. Considering academic stress and student life context

        Student's message: ${inputMessage}

        Please provide a concise, supportive response focused on the student's needs.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      if (!response.text()) {
        throw new Error('Empty response from Gemini API');
      }

      const botMessage: Message = {
        id: messages.length + 2,
        text: response.text(),
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: error.message === 'Gemini API key is not configured' 
          ? "The chatbot is not properly configured. Please ensure the API key is set up correctly."
          : "I apologize, but I'm having trouble responding right now. If you're feeling distressed, please contact a mental health professional or call the National Crisis Hotline (988).",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <Button
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-wellness-blue hover:bg-wellness-blue/90"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Student Mental Health Support</DialogTitle>
            <DialogDescription>
              Chat with an AI assistant for mental health support and resources.
            </DialogDescription>
          </DialogHeader>
          
          {/* Messages area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-wellness-blue text-white'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {message.text}
                    <div className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading}
              className="bg-wellness-blue hover:bg-wellness-blue/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 