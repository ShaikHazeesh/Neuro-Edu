import { useState, useRef, useEffect } from 'react';
import { SendHorizonal, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useAIChat, { ChatMessage } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface AIChatSectionProps {
  className?: string;
  initialPrompt?: string;
  onClose?: () => void;
}

export default function AIChatSection({ className, initialPrompt, onClose }: AIChatSectionProps) {
  const { messages, sendMessage, clearMessages, isLoading } = useAIChat();
  const [input, setInput] = useState(initialPrompt || '');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Format timestamp to show only hours and minutes
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Send the initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      sendMessage(initialPrompt);
      setInput('');
    }
  }, [initialPrompt, sendMessage]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };
  
  return (
    <Card className={cn("flex flex-col w-full h-full max-w-md shadow-lg", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="mb-2">👋 Hi there! I'm your AI assistant.</p>
            <p className="text-sm">I can help you with your programming questions and offer mental health support.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col max-w-[80%] rounded-lg p-3",
                  message.isUser 
                    ? "ml-auto bg-primary/10 text-foreground" 
                    : "mr-auto bg-muted/50"
                )}
              >
                <div className="break-words">{message.text}</div>
                <span className={cn(
                  "text-xs mt-1",
                  message.isUser ? "text-right" : "text-left",
                  "text-muted-foreground"
                )}>
                  {formatTime(message.timestamp)}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center mr-auto bg-muted/50 rounded-lg p-3 space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}