import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const LeftSideChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your learning assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Load chat state from localStorage
  useEffect(() => {
    const savedIsOpen = localStorage.getItem('leftChatIsOpen');
    if (savedIsOpen) {
      setIsOpen(savedIsOpen === 'true');
    }

    const savedMessages = localStorage.getItem('leftChatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const messagesWithDateObjects = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDateObjects);
      } catch (error) {
        console.error('Failed to parse saved messages:', error);
      }
    }
  }, []);

  // Save chat state to localStorage
  useEffect(() => {
    localStorage.setItem('leftChatIsOpen', isOpen.toString());
    localStorage.setItem('leftChatMessages', JSON.stringify(messages));
  }, [isOpen, messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponses = [
        "I can help you with that! Let me find some resources for you.",
        "That's a great question. Have you checked the course materials?",
        "I understand what you're asking. Let me explain...",
        "I'm here to help with your learning journey. Could you provide more details?",
        "That's an interesting topic! Let's explore it together.",
        "I recommend checking out the practice exercises for this concept.",
        "Have you tried solving similar problems before? Let's break this down step by step.",
        "Let me know if you need more clarification on this topic."
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed left-4 bottom-4 z-50 flex flex-col items-start">
      {/* Chat toggle button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={toggleChat}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all"
          aria-label="Toggle chat"
        >
          <MessageSquare size={20} />
        </button>
        <a
          href="/chatbot"
          className="flex items-center justify-center w-12 h-8 rounded-md bg-primary/20 text-primary text-xs font-medium shadow-sm hover:bg-primary/30 transition-all"
        >
          Full Chat
        </a>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          className={`bg-background border border-border rounded-lg shadow-lg mt-4 transition-all duration-300 overflow-hidden flex flex-col ${
            isMinimized ? 'w-64 h-12' : 'w-80 h-[500px] max-h-[80vh]'
          }`}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="font-medium flex items-center">
              <MessageSquare className="mr-2" size={16} />
              Learning Assistant
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMinimize}
                className="p-1 rounded-sm hover:bg-muted/50 text-muted-foreground"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={toggleChat}
                className="p-1 rounded-sm hover:bg-muted/50 text-muted-foreground"
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Chat messages */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 block text-right mt-1">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Chat input */}
          {!isMinimized && (
            <form onSubmit={handleSubmit} className="border-t border-border p-3 flex">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 bg-muted/30 rounded-l-md px-3 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-3 py-2 rounded-r-md hover:bg-primary/90"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default LeftSideChatBot;
