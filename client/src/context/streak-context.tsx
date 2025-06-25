import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import StreakPopup from '@/components/shared/StreakPopup';
import { updateUserStreaks } from '@/utils/localStorageUtils';

interface StreakContextType {
  streak: number;
  updateStreak: (newStreak: number) => void;
  lastStreakUpdate: string | null;
  forceShowStreakPopup: () => void;
  debugStreak: () => { streak: number, lastUpdate: string | null, popupState: boolean };
}

const StreakContext = createContext<StreakContextType>({
  streak: 0,
  updateStreak: () => {},
  lastStreakUpdate: null,
  forceShowStreakPopup: () => {},
  debugStreak: () => ({ streak: 0, lastUpdate: null, popupState: false })
});

interface StreakProviderProps {
  children: React.ReactNode;
}

export const StreakProvider: React.FC<StreakProviderProps> = ({ children }) => {
  const [streak, setStreak] = useState<number>(0);
  const [lastStreakUpdate, setLastStreakUpdate] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const previousStreakRef = useRef<number>(0);
  const hasShownPopupRef = useRef<boolean>(false);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeRef = useRef<number>(0);
  const hasUpdatedStreakTodayRef = useRef<boolean>(false);

  // Debug state to track popup visibility
  const [popupDebug, setPopupDebug] = useState<{
    visible: boolean;
    lastToggled: string;
    lastStreak: number;
    errorLog: string[];
  }>({
    visible: false,
    lastToggled: '',
    lastStreak: 0,
    errorLog: []
  });

  // Helper to log debug info
  const logDebug = (message: string) => {
    console.log(`[Streak][${new Date().toLocaleTimeString()}] ${message}`);

    // For critical issues, also keep in our error log
    if (message.includes('Error')) {
      setPopupDebug(prev => ({
        ...prev,
        errorLog: [...prev.errorLog.slice(-4), message] // Keep last 5 errors
      }));
    }
  };

  // Add debug function to expose state
  const debugStreak = (): { streak: number, lastUpdate: string | null, popupState: boolean } => {
    logDebug(`Current streak state: ${streak}, last update: ${lastStreakUpdate}, popup: ${showPopup}`);
    return {
      streak,
      lastUpdate: lastStreakUpdate,
      popupState: showPopup
    };
  };

  // Check if the streak has already been updated today
  const checkIfUpdatedToday = (): boolean => {
    if (!lastStreakUpdate) return false;

    const lastUpdateDate = new Date(lastStreakUpdate);
    const today = new Date();

    // Compare dates without time
    return lastUpdateDate.toDateString() === today.toDateString();
  };

  // Start activity timer to track user engagement
  const startActivityTracking = () => {
    // Clear any existing timer
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
    }

    // Don't start tracking if already updated today
    if (hasUpdatedStreakTodayRef.current) {
      logDebug('Streak already updated today, not starting activity tracking');
      return;
    }

    logDebug('Starting activity tracking for streak update');
    activityTimeRef.current = 0;

    // Set up interval to track activity time
    activityTimerRef.current = setInterval(() => {
      activityTimeRef.current += 1;

      // If user has been active for 5 seconds and streak hasn't been updated today
      if (activityTimeRef.current >= 5 && !hasUpdatedStreakTodayRef.current) {
        logDebug(`User has been active for ${activityTimeRef.current} seconds, updating streak`);

        // Update user streak in localStorage
        const streaks = updateUserStreaks();
        logDebug(`Updating streak to ${streaks.currentStreak}`);
        updateStreak(streaks.currentStreak);

        // Set flag to prevent multiple updates
        hasUpdatedStreakTodayRef.current = true;

        // Clear the interval since we've updated the streak
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current);
          activityTimerRef.current = null;
        }

        // Also force a server-side update
        try {
          fetch('/api/debug/update-streak', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              increment: true
            })
          })
          .then(response => response.json())
          .then(data => {
            logDebug(`Server streak updated to ${data.streak}`);
            if (data.streak) {
              updateStreak(data.streak);
            }
          })
          .catch(err => logDebug(`Error updating streak on server: ${err}`));
        } catch (error) {
          logDebug(`Failed to update streak on server: ${error}`);
        }
      }
    }, 1000);
  };

  // Reset timer when user interacts
  const resetActivityTimer = () => {
    if (hasUpdatedStreakTodayRef.current) return;

    // Reset timer but don't restart if not already running
    if (activityTimerRef.current) {
      activityTimeRef.current = 0;
    } else {
      // Start tracking if not already
      startActivityTracking();
    }
  };

  // Load streak from localStorage if available
  useEffect(() => {
    try {
      const savedStreak = localStorage.getItem('userStreak');
      const savedLastUpdate = localStorage.getItem('lastStreakUpdate');

      if (savedStreak) {
        const parsedStreak = parseInt(savedStreak);
        if (!isNaN(parsedStreak)) {
          logDebug(`Loaded streak from localStorage: ${parsedStreak}`);
          setStreak(parsedStreak);
          previousStreakRef.current = parsedStreak;
        } else {
          logDebug(`Error: Invalid streak value in localStorage: "${savedStreak}"`);
        }
      } else {
        logDebug('No saved streak found in localStorage');
      }

      if (savedLastUpdate) {
        logDebug(`Loaded last streak update: ${savedLastUpdate}`);
        setLastStreakUpdate(savedLastUpdate);

        // Check if the streak needs to be reset (if it's a new day)
        const lastUpdateDate = new Date(savedLastUpdate);
        const today = new Date();

        // Reset streak if last update was more than 48 hours ago (missed a day)
        if (today.getTime() - lastUpdateDate.getTime() > 48 * 60 * 60 * 1000) {
          logDebug(`Streak reset due to inactivity (${Math.floor((today.getTime() - lastUpdateDate.getTime()) / (24 * 60 * 60 * 1000))} days since last update)`);
          setStreak(0);
          previousStreakRef.current = 0;
          localStorage.setItem('userStreak', '0');
        }

        // Check if already updated today
        hasUpdatedStreakTodayRef.current = checkIfUpdatedToday();
        logDebug(`Has already updated streak today: ${hasUpdatedStreakTodayRef.current}`);
      } else {
        logDebug('No saved lastStreakUpdate found in localStorage');
      }

      // We no longer start activity tracking
      // The streak will only update through explicit actions
    } catch (error) {
      logDebug(`Error loading streak from localStorage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Add user interaction event listeners
  useEffect(() => {
    const resetActivity = () => resetActivityTimer();

    // Add event listeners for different user activities
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('scroll', resetActivity);
    window.addEventListener('click', resetActivity);

    // Clean up event listeners
    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      window.removeEventListener('click', resetActivity);

      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, []);

  // Modified: Check for day change to reset hasUpdatedToday flag at midnight
  // We still need this to reset the flag, but we won't start activity tracking
  useEffect(() => {
    const checkForNewDay = () => {
      if (!lastStreakUpdate) return;

      const lastUpdateDate = new Date(lastStreakUpdate);
      const today = new Date();

      if (lastUpdateDate.toDateString() !== today.toDateString()) {
        logDebug('New day detected, resetting hasUpdatedToday flag');
        // Reset the flag so streak can be updated today through explicit actions
        hasUpdatedStreakTodayRef.current = false;
        // We don't call startActivityTracking() anymore
      }
    };

    // Check immediately
    checkForNewDay();

    // Set up interval to check periodically (every minute)
    const dayCheckInterval = setInterval(checkForNewDay, 60000);

    return () => clearInterval(dayCheckInterval);
  }, [lastStreakUpdate]);

  // Function to force show the streak popup for testing or manual triggers
  const forceShowStreakPopup = () => {
    logDebug("Forcing streak popup to show");

    // First hide any existing popup to reset animation
    setShowPopup(false);

    // Then show it after a brief delay
    setTimeout(() => {
    setShowPopup(true);
    hasShownPopupRef.current = true;

      setPopupDebug(prev => ({
        ...prev,
      visible: true,
      lastToggled: new Date().toISOString(),
      lastStreak: streak
      }));

      // Auto-hide after 5 seconds
    setTimeout(() => {
        logDebug("Auto-hiding force-shown streak popup");
      setShowPopup(false);
      setPopupDebug(prev => ({...prev, visible: false, lastToggled: new Date().toISOString()}));

      // Reset the popup flag after hiding
      setTimeout(() => {
        hasShownPopupRef.current = false;
      }, 500);
      }, 5000);
    }, 100);
  };

  const updateStreak = (newStreak: number) => {
    logDebug(`Updating streak: ${streak} → ${newStreak}`);

    // Ensure newStreak is a valid number
    const validStreak = Math.max(0, Number(newStreak) || 0);

    if (validStreak === streak) {
      logDebug("Streak unchanged, not updating");
      return;
    }

    // Save the new streak value
    setStreak(validStreak);

    // Save current date as last update
    const now = new Date().toISOString();
    setLastStreakUpdate(now);

    try {
      localStorage.setItem('userStreak', validStreak.toString());
      localStorage.setItem('lastStreakUpdate', now);
      logDebug(`Saved streak ${validStreak} to localStorage`);

      // Mark that we've updated the streak today
      hasUpdatedStreakTodayRef.current = true;
    } catch (error) {
      logDebug(`Error saving streak to localStorage: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Show popup only if streak has increased
    if (validStreak > previousStreakRef.current) {
      logDebug(`Streak increased! Showing popup. New streak: ${validStreak}, previous: ${previousStreakRef.current}`);

      // Set popup to visible
      setShowPopup(true);
      hasShownPopupRef.current = true;

      setPopupDebug({
        visible: true,
        lastToggled: now,
        lastStreak: validStreak,
        errorLog: popupDebug.errorLog
      });

      // Automatically hide popup after 4 seconds
      setTimeout(() => {
        logDebug("Auto-hiding streak popup after timeout");
        setShowPopup(false);
        setPopupDebug(prev => ({...prev, visible: false, lastToggled: new Date().toISOString()}));

        // Reset the popup flag after a delay to allow showing it again for future streak updates
        setTimeout(() => {
          hasShownPopupRef.current = false;
        }, 500);
      }, 4000);
    } else {
      logDebug(`Not showing popup: new streak ${validStreak} ≤ previous ${previousStreakRef.current}, hasShown=${hasShownPopupRef.current}`);
    }

    // Update previous streak reference
    previousStreakRef.current = validStreak;

    // Dispatch a custom event for other components to handle if needed
    try {
      const streakEvent = new CustomEvent('streakUpdated', {
        detail: { streak: validStreak }
      });
      window.dispatchEvent(streakEvent);
      logDebug("Streak event dispatched");
    } catch (error) {
      logDebug(`Error dispatching streak event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const closePopup = () => {
    logDebug("Manually closing streak popup");
    setShowPopup(false);
    setPopupDebug(prev => ({...prev, visible: false, lastToggled: new Date().toISOString()}));

    // Reset the popup flag after closing
    setTimeout(() => {
      hasShownPopupRef.current = false;
    }, 500);
  };

  return (
    <StreakContext.Provider value={{
      streak,
      updateStreak,
      lastStreakUpdate,
      forceShowStreakPopup,
      debugStreak
    }}>
      {children}
      {showPopup && (
        <StreakPopup
          streak={streak}
          onClose={closePopup}
        />
      )}
    </StreakContext.Provider>
  );
};

export const useStreak = () => useContext(StreakContext);

export default StreakProvider;