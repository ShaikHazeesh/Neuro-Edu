import { useState } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import MentalHealthTools from "@/components/sections/MentalHealthTools";
import AIChatSection from "@/components/sections/AIChatSection";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";

const breathingSteps = [
  "Breathe in slowly through your nose for 4 seconds",
  "Hold your breath for 7 seconds",
  "Exhale slowly through your mouth for 8 seconds",
  "Repeat the cycle"
];

const MentalHealth = () => {
  const [activeTab, setActiveTab] = useState("tools");
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingStep, setBreathingStep] = useState(0);
  const [breathingProgress, setBreathingProgress] = useState(0);
  
  const startBreathingExercise = () => {
    setBreathingActive(true);
    setBreathingStep(0);
    setBreathingProgress(0);
    
    // Simulate breathing exercise with progress
    const interval = setInterval(() => {
      setBreathingProgress(prev => {
        if (prev >= 100) {
          setBreathingStep(currentStep => {
            const nextStep = (currentStep + 1) % breathingSteps.length;
            return nextStep;
          });
          return 0;
        }
        return prev + 5;
      });
    }, 250);
    
    // Clean up
    return () => clearInterval(interval);
  };
  
  const stopBreathingExercise = () => {
    setBreathingActive(false);
  };

  return (
    <MainLayout>
      <div className="py-12 px-4 bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-darkBg">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Mental Health Support</h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Resources and tools to support your mental wellbeing alongside your programming journey.
            </p>
          </motion.div>
          
          <Tabs defaultValue="tools" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 max-w-xl mx-auto mb-8">
              <TabsTrigger value="tools">Support Tools</TabsTrigger>
              <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
              <TabsTrigger value="breathing">Breathing</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools">
              <MentalHealthTools />
            </TabsContent>
            
            <TabsContent value="ai-chat">
              <div className="max-w-xl mx-auto mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft mb-6">
                  <h2 className="text-2xl font-outfit font-semibold mb-4">AI Mental Health Assistant</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Talk to our AI assistant about anything that's on your mind. Whether you're feeling stressed about your programming studies or need someone to talk to, our AI is here to help.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    <strong>Note:</strong> While our AI can provide general support, it is not a replacement for professional mental health care. If you're experiencing a mental health crisis, please reach out to a professional or use the crisis resources listed in the Resources tab.
                  </p>
                </div>
                
                <div className="h-[500px]">
                  <AIChatSection 
                    className="h-full w-full"
                    initialPrompt={
                      activeTab === "ai-chat" ? 
                      "I'm feeling a bit stressed with my programming studies. Can you give me some advice?" 
                      : undefined
                    }
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="breathing">
              <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-standard shadow-soft p-8 text-center">
                <motion.div 
                  className="w-40 h-40 rounded-full bg-secondary/10 mx-auto mb-6 flex items-center justify-center"
                  animate={breathingActive ? { 
                    scale: breathingStep === 0 ? [1, 1.2] : 
                            breathingStep === 1 ? 1.2 : 
                            breathingStep === 2 ? [1.2, 1] : 1 
                  } : {}}
                  transition={{ duration: 4, ease: "easeInOut" }}
                >
                  <span className="material-icons text-5xl text-secondary">air</span>
                </motion.div>
                
                <h2 className="text-xl font-outfit font-semibold mb-4">4-7-8 Breathing Technique</h2>
                
                {breathingActive ? (
                  <>
                    <p className="text-lg font-outfit mb-6 min-h-[60px]">
                      {breathingSteps[breathingStep]}
                    </p>
                    <div className="mb-8">
                      <Progress value={breathingProgress} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-standard font-medium transition-colors"
                      onClick={stopBreathingExercise}
                    >
                      End Exercise
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      The 4-7-8 breathing technique can help reduce anxiety, help you fall asleep, and manage stress responses.
                    </p>
                    <button 
                      className="bg-secondary hover:bg-opacity-90 text-white px-6 py-3 rounded-standard font-medium transition-colors"
                      onClick={startBreathingExercise}
                    >
                      Start Breathing Exercise
                    </button>
                  </>
                )}
              </div>
              
              <div className="max-w-2xl mx-auto mt-8">
                <h3 className="text-xl font-outfit font-semibold mb-4">Benefits of Deep Breathing</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="material-icons text-secondary mr-2 mt-0.5">check_circle</span>
                    <span>Reduces stress and anxiety levels</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-secondary mr-2 mt-0.5">check_circle</span>
                    <span>Increases focus and concentration for learning</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-secondary mr-2 mt-0.5">check_circle</span>
                    <span>Helps manage emotional responses when faced with coding challenges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-secondary mr-2 mt-0.5">check_circle</span>
                    <span>Improves overall mental wellbeing during intense study sessions</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="resources">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Crisis Resources */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft">
                    <div className="flex items-center mb-4">
                      <span className="material-icons text-red-500 mr-3">emergency</span>
                      <h3 className="text-xl font-outfit font-semibold">Crisis Support</h3>
                    </div>
                    <ul className="space-y-4">
                      <li>
                        <h4 className="font-medium mb-1">National Suicide Prevention Lifeline</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">24/7 support for people in distress</p>
                        <a href="tel:988" className="text-primary dark:text-accent font-medium mt-1 block">988</a>
                      </li>
                      <li>
                        <h4 className="font-medium mb-1">Crisis Text Line</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Text HOME to 741741 for crisis support</p>
                        <a href="sms:741741" className="text-primary dark:text-accent font-medium mt-1 block">Text HOME to 741741</a>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Self-Help Resources */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft">
                    <div className="flex items-center mb-4">
                      <span className="material-icons text-secondary mr-3">menu_book</span>
                      <h3 className="text-xl font-outfit font-semibold">Self-Help Resources</h3>
                    </div>
                    <ul className="space-y-4">
                      <li>
                        <h4 className="font-medium mb-1">Mindfulness for Programmers</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Techniques for maintaining focus while coding</p>
                        <a href="#" className="text-primary dark:text-accent font-medium mt-1 block">Download Guide</a>
                      </li>
                      <li>
                        <h4 className="font-medium mb-1">Coping with Learning Frustration</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Strategies for managing programming challenges</p>
                        <a href="#" className="text-primary dark:text-accent font-medium mt-1 block">Read Article</a>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Campus Resources */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft">
                    <div className="flex items-center mb-4">
                      <span className="material-icons text-accent mr-3">school</span>
                      <h3 className="text-xl font-outfit font-semibold">Campus Resources</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Many schools offer free or reduced-cost mental health services for students.
                    </p>
                    <button className="bg-accent/10 dark:bg-accent/20 text-accent px-4 py-2 rounded-standard text-sm font-medium">
                      Find Campus Resources
                    </button>
                  </div>
                  
                  {/* Community Support */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft">
                    <div className="flex items-center mb-4">
                      <span className="material-icons text-primary mr-3">groups</span>
                      <h3 className="text-xl font-outfit font-semibold">Community Support</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Connect with peers who understand the mental health challenges of learning to code.
                    </p>
                    <button className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent px-4 py-2 rounded-standard text-sm font-medium">
                      Join Support Forum
                    </button>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft mt-6">
                  <div className="flex items-center mb-4">
                    <span className="material-icons text-green-500 mr-3">health_and_safety</span>
                    <h3 className="text-xl font-outfit font-semibold">Mental Health Articles</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <span>Managing Imposter Syndrome in Tech</span>
                      <span className="material-icons text-gray-500">arrow_forward</span>
                    </li>
                    <li className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <span>Burnout Prevention for Programmers</span>
                      <span className="material-icons text-gray-500">arrow_forward</span>
                    </li>
                    <li className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <span>Finding Work-Study-Life Balance</span>
                      <span className="material-icons text-gray-500">arrow_forward</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default MentalHealth;
