import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

export const StreakPopup: React.FC<StreakPopupProps> = ({ streak, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const confettiTriggeredRef = useRef(false);

  // Set up confetti effect and auto-closing
  useEffect(() => {
    if (isVisible && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      
      // Create a more impressive confetti effect
      const fireConfetti = () => {
        try {
          // Fire confetti from multiple positions for a more impressive effect
          const confettiSettings = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 }
          };
          
          // Right side
          confetti({
            ...confettiSettings,
            origin: { x: 0.9, y: 0.8 }
          });
          
          // Center-bottom
          setTimeout(() => {
            confetti({
              ...confettiSettings,
              origin: { x: 0.5, y: 0.9 }
            });
          }, 150);
          
          // Left side
          setTimeout(() => {
            confetti({
              ...confettiSettings,
              origin: { x: 0.1, y: 0.8 }
            });
          }, 300);
          
          // Fire more confetti for streak milestones
          if (streak % 5 === 0) {
            setTimeout(() => {
              // Create a confetti cannon effect
              const duration = 1000;
              const end = Date.now() + duration;
              
              const frame = () => {
                confetti({
                  particleCount: 2,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0, y: 0.8 }
                });
                
                confetti({
                  particleCount: 2,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1, y: 0.8 }
                });
                
                if (Date.now() < end) {
                  requestAnimationFrame(frame);
                }
              };
              
              frame();
            }, 600);
          }
        } catch (error) {
          console.error("Error with confetti:", error);
        }
      };
      
      // Small delay to ensure the component is mounted
      setTimeout(fireConfetti, 100);
    }
    
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Allow exit animation to complete
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose, streak, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-8 right-8 z-50 flex items-center"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-2xl shadow-lg flex items-center">
            <div className="bg-white/20 rounded-full p-3 mr-4 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <span className="material-icons text-2xl">local_fire_department</span>
              </motion.div>
            </div>
            <div>
              <h3 className="font-bold text-lg">Streak Updated!</h3>
              <div className="flex items-center">
                <motion.span 
                  className="font-medium text-3xl mr-2"
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 2,
                    repeatDelay: 0.3
                  }}
                >
                  {streak}
                </motion.span>
                <span>day{streak !== 1 ? 's' : ''} streak</span>
              </div>
              <p className="text-sm mt-1 opacity-80">Keep it up!</p>
              
              {/* Show special message for milestones */}
              {streak % 5 === 0 && (
                <motion.p 
                  className="mt-2 font-bold text-yellow-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {streak} day milestone! 🎉
                </motion.p>
              )}
            </div>
            
            {/* Close button */}
            <button 
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close streak notification"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakPopup;