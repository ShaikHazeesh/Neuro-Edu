import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
}

const initialMessages: ChatMessage[] = [
  {
    id: "initial-0",
    text: "Hi there! I'm your learning and support assistant. How can I help you today?",
    isUser: false,
  },
];

function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Create unique ID
    const userMsgId = `user-${Date.now()}`;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: userMsgId,
      text,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send message to API
      const response = await apiRequest("POST", "/api/chat", { message: text });
      const data = await response.json();

      // Add bot response with slight delay to simulate typing
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: data.response,
          isUser: false,
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      setTimeout(() => {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          text: "Sorry, I'm having trouble connecting. Please try again later.",
          isUser: false,
        };
        
        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  return {
    messages,
    sendMessage,
    isTyping,
  };
}

export default useAIChat;
