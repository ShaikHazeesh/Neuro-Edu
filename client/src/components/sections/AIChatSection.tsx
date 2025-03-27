import { useState } from "react";
import { motion } from "framer-motion";
import useAIChat from "@/hooks/useAIChat";

const AIChatSection = () => {
  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage, isTyping } = useAIChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue);
    setInputValue("");
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-4">AI Learning & Support Assistant</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our AI assistant is trained to help with both programming questions and provide mental health support resources.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full mr-4">
                  <span className="material-icons text-primary">smart_toy</span>
                </div>
                <div>
                  <h3 className="font-outfit font-medium mb-1">24/7 Learning Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get help with coding problems anytime, with explanations tailored to your learning style.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-secondary/10 dark:bg-secondary/20 p-2 rounded-full mr-4">
                  <span className="material-icons text-secondary">psychology</span>
                </div>
                <div>
                  <h3 className="font-outfit font-medium mb-1">Emotional Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Receive coping strategies and resources when you're feeling stressed or overwhelmed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-accent/10 dark:bg-accent/20 p-2 rounded-full mr-4">
                  <span className="material-icons text-accent">record_voice_over</span>
                </div>
                <div>
                  <h3 className="font-outfit font-medium mb-1">Judgment-Free Zone</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Ask any question without fear - our AI creates a safe space for learning and support.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-background dark:bg-darkBg rounded-standard shadow-soft overflow-hidden max-w-md mx-auto">
              <div className="bg-primary dark:bg-primary/80 text-white p-4">
                <div className="flex items-center">
                  <span className="material-icons mr-2">smart_toy</span>
                  <h3 className="font-outfit font-medium">AI Assistant</h3>
                </div>
              </div>
              
              <div className="h-80 p-4 overflow-y-auto hide-scrollbar">
                {/* Chat Messages */}
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex items-start ${message.isUser ? 'justify-end' : ''}`}>
                      {!message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="material-icons text-primary text-sm">smart_toy</span>
                        </div>
                      )}
                      <div className={`${
                        message.isUser 
                          ? 'bg-primary text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                          : 'bg-gray-100 dark:bg-gray-700 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                        } p-3 max-w-xs`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      {message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-2 flex-shrink-0">
                          <span className="material-icons text-gray-500 dark:text-gray-400 text-sm">person</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* AI Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="material-icons text-primary text-sm">smart_toy</span>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-tr-lg rounded-br-lg rounded-bl-lg p-3">
                        <p className="text-sm typing-animation">Typing</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <input 
                    type="text" 
                    placeholder="Ask me anything..." 
                    className="flex-grow bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                  />
                  <button 
                    type="submit" 
                    className="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                    disabled={isTyping || !inputValue.trim()}
                  >
                    <span className="material-icons text-sm">send</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Powered by Qroq API • Your conversations are private
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AIChatSection;
