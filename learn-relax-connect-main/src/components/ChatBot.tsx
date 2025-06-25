import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatbotService } from '@/services/chatbot'
import { GeminiService } from '@/services/gemini'
import { geminiConfig } from '@/config/gemini'
import { Loader2, Brain, School } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'success' | 'error' | 'info';
}

interface ChatBotProps {
  standalone?: boolean;
}

type ChatMode = 'admin' | 'mental-health';

export function ChatBot({ standalone = false }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('admin');
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini service
  useEffect(() => {
    const initGemini = async () => {
      try {
        await GeminiService.initialize(geminiConfig);
        setGeminiError(null);
      } catch (error) {
        console.error('Failed to initialize Gemini service:', error);
        setGeminiError('Mental health support is currently unavailable. Please try again later.');
      }
    };

    if (mode === 'mental-health') {
      initGemini();
    }
  }, [mode]);

  // Set initial message based on mode
  useEffect(() => {
    const initialMessage = mode === 'admin' 
      ? "Hello! I'm your student admin assistant. How can I help you today? You can ask me about courses, grades, schedules, or payments."
      : "Hi! I'm here to support your mental well-being. Feel free to share what's on your mind, and I'll do my best to help or guide you to appropriate resources.";

    setMessages([{
      id: 1,
      text: initialMessage,
      sender: 'bot',
      timestamp: new Date(),
      status: 'info',
    }]);
  }, [mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (mode === 'mental-health' && geminiError) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: geminiError,
        sender: 'bot',
        timestamp: new Date(),
        status: 'error',
      }]);
      return;
    }

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
      // Get response based on mode
      const response = mode === 'admin'
        ? await ChatbotService.getResponse(inputMessage)
        : await GeminiService.getMentalHealthResponse(inputMessage);
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        status: response.type,
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: mode === 'admin'
          ? "Sorry, I'm having trouble processing your request right now. Please try again later."
          : "I apologize, but I'm having trouble responding. If you're in immediate distress, please contact a mental health professional or crisis hotline.",
        sender: 'bot',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <div className="mb-4">
        <ToggleGroup type="single" value={mode} onValueChange={(value: ChatMode) => value && setMode(value)}>
          <ToggleGroupItem value="admin" aria-label="Toggle admin mode">
            <School className="h-4 w-4 mr-2" />
            Admin
          </ToggleGroupItem>
          <ToggleGroupItem value="mental-health" aria-label="Toggle mental health mode">
            <Brain className="h-4 w-4 mr-2" />
            Mental Health
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {geminiError && mode === 'mental-health' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{geminiError}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className={standalone ? "h-[400px]" : "h-[300px]"}>
        <div className="pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.status === 'error'
                    ? 'bg-destructive text-destructive-foreground'
                    : message.status === 'info'
                    ? 'bg-secondary'
                    : 'bg-muted'
                }`}
              >
                {message.text}
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="flex gap-2 mt-4">
        <Input
          placeholder={mode === 'admin' ? "Ask about courses, grades, etc..." : "Share what's on your mind..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          disabled={isLoading || (mode === 'mental-health' && geminiError !== null)}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={isLoading || (mode === 'mental-health' && geminiError !== null)}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </>
  );

  if (standalone) {
    return (
      <Card className="w-[400px] h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="/bot-avatar.png" />
              <AvatarFallback>BOT</AvatarFallback>
            </Avatar>
            {mode === 'admin' ? 'Student Admin Assistant' : 'Mental Health Support'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
} 