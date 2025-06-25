import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, PauseCircle, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useActivityTracker } from '@/hooks/use-activity-tracker';

const breathingSteps = [
  {
    id: 0,
    instruction: "Breathe in slowly through your nose for 4 seconds",
    duration: 4,
    animation: "expand",
  },
  {
    id: 1,
    instruction: "Hold your breath for 7 seconds",
    duration: 7,
    animation: "hold",
  },
  {
    id: 2,
    instruction: "Exhale slowly through your mouth for 8 seconds",
    duration: 8,
    animation: "contract",
  },
  {
    id: 3,
    instruction: "Prepare for the next breath",
    duration: 2,
    animation: "rest",
  },
];

const totalCycleDuration = breathingSteps.reduce((total, step) => total + step.duration, 0);

const BreathingExercise = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Breathing circle animation states
  const circleVariants = {
    expand: {
      scale: 1.3,
      transition: { duration: 4, ease: "easeInOut" }
    },
    hold: {
      scale: 1.3,
      transition: { duration: 7 }
    },
    contract: {
      scale: 1,
      transition: { duration: 8, ease: "easeInOut" }
    },
    rest: {
      scale: 1,
      transition: { duration: 2 }
    }
  };
  
  // Sound effects for guided breathing
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    if (soundEnabled && isActive) {
      switch (currentStep) {
        case 0:
          audio = new Audio("/sounds/inhale.mp3");
          break;
        case 1:
          audio = new Audio("/sounds/hold.mp3");
          break;
        case 2:
          audio = new Audio("/sounds/exhale.mp3");
          break;
      }
      
      if (audio) {
        audio.play().catch(e => console.error("Audio playback error:", e));
      }
    }
    
    return () => {
      if (audio) {
        audio.pause();
        audio = null;
      }
    };
  }, [currentStep, soundEnabled, isActive]);

  // Main breathing exercise timer logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isActive) {
      intervalId = setInterval(() => {
        setProgress(prev => {
          // Calculate new progress
          const stepDuration = breathingSteps[currentStep].duration;
          const stepProgress = (prev + 1) % (stepDuration * 100);
          
          // If we've completed the current step
          if (stepProgress === 0) {
            setCurrentStep(prevStep => {
              const nextStep = (prevStep + 1) % breathingSteps.length;
              
              // If we're completing a full cycle
              if (nextStep === 0) {
                setCycleCount(prevCount => prevCount + 1);
              }
              
              return nextStep;
            });
          }
          
          return stepProgress;
        });
        
        setTimeElapsed(prev => prev + 0.01);
      }, 10); // Update every 10ms for smoother progress
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, currentStep]);

  // Convert time elapsed to minutes and seconds
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate step progress percentage
  const getStepProgressPercentage = () => {
    const stepDuration = breathingSteps[currentStep].duration;
    return (progress / (stepDuration * 100)) * 100;
  };
  
  // Handle start/pause
  const toggleExercise = () => {
    setIsActive(!isActive);
  };
  
  // Reset the exercise
  const resetExercise = () => {
    setIsActive(false);
    setCurrentStep(0);
    setProgress(0);
    setCycleCount(0);
    setTimeElapsed(0);
  };
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Track mental health activity
  useActivityTracker({ activityType: 'mental' });

  return (
    <MainLayout>
      <div className="py-12 px-4 bg-gradient-to-b from-accent/10 to-background dark:from-accent/20 dark:to-darkBg">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Breathing Exercise</h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Take a moment to calm your mind and reduce stress with guided breathing
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col items-center">
              <div className="relative mb-8 flex items-center justify-center">
                {/* Background circle */}
                <div className="absolute w-64 h-64 rounded-full bg-accent/5 dark:bg-accent/10"></div>
                
                {/* Animated breathing circle */}
                <motion.div 
                  className="w-48 h-48 rounded-full bg-accent/20 dark:bg-accent/30 flex items-center justify-center z-10"
                  animate={breathingSteps[currentStep].animation}
                  variants={circleVariants}
                >
                  <span className="text-accent text-xl font-medium">
                    {isActive ? currentStep + 1 : "Start"}
                  </span>
                </motion.div>
              </div>
              
              {/* Current instruction */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft mb-6 text-center w-full">
                <h2 className="text-xl font-medium mb-4">
                  {isActive ? breathingSteps[currentStep].instruction : "Ready to begin?"}
                </h2>
                
                {isActive && (
                  <Progress 
                    value={getStepProgressPercentage()} 
                    className="h-2 mb-2" 
                  />
                )}
                
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSound}
                    className="rounded-full"
                  >
                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    className="rounded-full w-12 h-12 flex items-center justify-center"
                    onClick={toggleExercise}
                  >
                    {isActive ? (
                      <PauseCircle className="h-6 w-6" />
                    ) : (
                      <PlayCircle className="h-6 w-6" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetExercise}
                    className="rounded-full"
                    disabled={!isActive && timeElapsed === 0}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 w-full">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="text-2xl font-bold">{formatTime(timeElapsed)}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Cycles</p>
                    <p className="text-2xl font-bold">{cycleCount}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Phase</p>
                    <p className="text-2xl font-bold">{currentStep + 1}/4</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Information sidebar */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-4">The 4-7-8 Technique</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    This breathing technique is a natural tranquilizer for the nervous system that can help you:
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>Reduce anxiety when stuck on coding problems</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>Fall asleep faster after late-night study sessions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>Manage stress during exams or project deadlines</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>Improve focus and concentration for learning</span>
                    </li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    For best results, practice this exercise at least twice daily.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-4">How It Works</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-primary/10 dark:bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center text-primary font-medium mr-3 flex-shrink-0">1</div>
                      <div>
                        <p className="font-medium">Breathe In (4 seconds)</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Through your nose, quietly and deeply</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-secondary/10 dark:bg-secondary/20 h-8 w-8 rounded-full flex items-center justify-center text-secondary font-medium mr-3 flex-shrink-0">2</div>
                      <div>
                        <p className="font-medium">Hold (7 seconds)</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Keep your breath in completely</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-accent/10 dark:bg-accent/20 h-8 w-8 rounded-full flex items-center justify-center text-accent font-medium mr-3 flex-shrink-0">3</div>
                      <div>
                        <p className="font-medium">Exhale (8 seconds)</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Through your mouth, making a whooshing sound</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-gray-100 dark:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center text-gray-500 font-medium mr-3 flex-shrink-0">4</div>
                      <div>
                        <p className="font-medium">Repeat</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Complete at least 4 full cycles</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BreathingExercise;