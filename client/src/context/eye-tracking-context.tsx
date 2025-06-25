import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import EyeTracker from '@/components/sections/EyeTracker';
import { useAuth } from '@/hooks/use-auth';

interface EyeTrackingContextType {
  isPaused: boolean;
  pauseActivities: () => void;
  resumeActivities: () => void;
}

const EyeTrackingContext = createContext<EyeTrackingContextType | undefined>(undefined);

interface EyeTrackingProviderProps {
  children: ReactNode;
}

export const EyeTrackingProvider: React.FC<EyeTrackingProviderProps> = ({ children }) => {
  const [isPaused, setIsPaused] = useState(false);
  const { user } = useAuth();

  // Function to pause all activities
  const pauseActivities = () => {
    setIsPaused(true);
    
    // Add a class to the body to prevent interactions
    document.body.classList.add('activity-paused');
    
    // Pause any videos that might be playing
    document.querySelectorAll('video').forEach(video => {
      if (!video.paused) {
        video.pause();
      }
    });
    
    // Pause any audio that might be playing
    document.querySelectorAll('audio').forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });

    // Store the current scroll position
    document.documentElement.style.setProperty(
      '--scroll-position',
      `${window.scrollY}px`
    );

    // Disable scrolling
    document.documentElement.style.setProperty('overflow', 'hidden');
  };

  // Function to resume all activities
  const resumeActivities = () => {
    setIsPaused(false);
    
    // Remove the class from the body
    document.body.classList.remove('activity-paused');
    
    // Re-enable scrolling
    document.documentElement.style.removeProperty('overflow');
  };

  return (
    <EyeTrackingContext.Provider value={{ isPaused, pauseActivities, resumeActivities }}>
      {user && <EyeTracker pauseActivities={pauseActivities} resumeActivities={resumeActivities} />}
      {children}
    </EyeTrackingContext.Provider>
  );
};

export const useEyeTracking = (): EyeTrackingContextType => {
  const context = useContext(EyeTrackingContext);
  if (context === undefined) {
    throw new Error('useEyeTracking must be used within an EyeTrackingProvider');
  }
  return context;
}; 