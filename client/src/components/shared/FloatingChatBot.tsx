import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  timestamp: Date;
}

interface FloatingChatBotProps {
  fullScreen?: boolean;
}

export default function FloatingChatBot({ fullScreen = false }: FloatingChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-message",
      isUser: false,
      text: "👋 Hi there! I'm your AI assistant for both programming help and mental wellbeing support. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    async function loadChatHistory() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/chat-history');
        if (response.ok) {
          const history = await response.json();
          if (history && history.length > 0) {
            const formattedHistory: ChatMessage[] = [];
            
            // Create alternating user and AI messages
            history.forEach((entry: any) => {
              formattedHistory.push({
                id: `user-${entry.id}`,
                isUser: true,
                text: entry.message,
                timestamp: new Date(entry.createdAt)
              });
              
              formattedHistory.push({
                id: `ai-${entry.id}`,
                isUser: false,
                text: entry.response,
                timestamp: new Date(entry.createdAt)
              });
            });
            
            // Set messages with welcome message + history
            setMessages(prev => [prev[0], ...formattedHistory]);
          }
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    }
    
    loadChatHistory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      isUser: true,
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.text,
          history: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.text
          }))
        }),
      });

      if (!response.ok) {
        const errorStatus = response.status;
        let errorMessage = `Error: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Failed to parse the AI response');
      }
      
      // Add AI response
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        text: data.response,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        text: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.isUser 
                  ? "bg-primary text-primary-foreground ml-auto" 
                  : "bg-muted mr-auto"
              )}
            >
              {message.text}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted rounded-lg p-3 max-w-[80%] mr-auto"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form 
        onSubmit={handleSubmit}
        className="border-t p-3 flex items-end gap-2"
      >
        <Textarea
          placeholder="Ask me about programming or mental wellbeing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}