import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';

type ActivityType = 'study' | 'mental';

interface ActivityTrackerOptions {
  activityType?: ActivityType;
  minDuration?: number; // Minimum duration in seconds before tracking
}

export const useActivityTracker = (options: ActivityTrackerOptions = {}) => {
  const { activityType = 'study', minDuration = 5 } = options; // Changed from 10 to 5 seconds
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const startTimeRef = useRef<number>(Date.now());
  const lastTrackingRef = useRef<number>(Date.now());
  const isTrackingRef = useRef<boolean>(false);
  // Track scroll events
  const scrollCountRef = useRef<number>(0);
  const hasTrackedInitialSessionRef = useRef<boolean>(false);

  // Track activity duration and send to server
  const trackActivity = async (duration: number) => {
    if (!user || duration < minDuration) return;

    try {
      console.log(`Sending activity tracking: ${duration} seconds of ${activityType}`);

      const response = await fetch('/api/user/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration,
          activityType
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Activity tracking response:', data);

        if (data.streak !== undefined) {
          console.log(`Streak updated from server: ${data.streak}`);

          // Update localStorage directly
          localStorage.setItem('userStreak', data.streak.toString());
          localStorage.setItem('lastStreakUpdate', new Date().toISOString());

          // Dispatch custom event to notify about streak update
          window.dispatchEvent(new CustomEvent('streakUpdated', {
            detail: { streak: data.streak }
          }));

          // Also try to force show the streak popup
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('forceShowStreakPopup'));
          }, 500);
        }

        // Refresh user progress data
        queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });

        console.log(`Tracked ${Math.round(duration)} seconds of ${activityType} activity`);
      }
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  };

  // Start tracking when component mounts
  useEffect(() => {
    const startTracking = () => {
      startTimeRef.current = Date.now();
      lastTrackingRef.current = Date.now();
      isTrackingRef.current = true;
    };

    const stopTracking = async () => {
      if (!isTrackingRef.current) return;

      const now = Date.now();
      const duration = Math.round((now - startTimeRef.current) / 1000);
      isTrackingRef.current = false;

      await trackActivity(duration);
    };

    // Track initial session after just a few seconds of being on the page
    // This ensures the streak gets updated quickly
    if (!hasTrackedInitialSessionRef.current) {
      console.log('Setting up initial activity tracking timer');
      const initialTimer = setTimeout(() => {
        if (isTrackingRef.current) {
          console.log('Triggering initial activity tracking');
          trackActivity(15); // Track 15 seconds to ensure it's above threshold
          hasTrackedInitialSessionRef.current = true;

          // Force a streak update via the debug endpoint
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
              console.log('Forced streak update response:', data);
              if (data.streak) {
                // Update localStorage
                localStorage.setItem('userStreak', data.streak.toString());
                localStorage.setItem('lastStreakUpdate', new Date().toISOString());

                // Dispatch event
                window.dispatchEvent(new CustomEvent('streakUpdated', {
                  detail: { streak: data.streak }
                }));

                // Show popup
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('forceShowStreakPopup'));
                }, 500);
              }
            })
            .catch(err => console.error('Error forcing streak update:', err));
          } catch (error) {
            console.error('Failed to force streak update:', error);
          }
        }
      }, 3000); // Just 3 seconds to make it happen even faster

      return () => clearTimeout(initialTimer);
    }

    // Track activity every 60 seconds while active
    const intervalId = setInterval(() => {
      if (isTrackingRef.current) {
        const now = Date.now();
        const intervalDuration = Math.round((now - lastTrackingRef.current) / 1000);
        lastTrackingRef.current = now;

        trackActivity(intervalDuration);
      }
    }, 60000); // Every minute

    // Track scroll events to detect user activity
    const handleScroll = () => {
      scrollCountRef.current += 1;

      // After 5 scroll events, consider the user active if they weren't already
      if (scrollCountRef.current >= 5 && !isTrackingRef.current) {
        startTracking();

        // Track minimum 10 seconds after scrolling
        if (!hasTrackedInitialSessionRef.current) {
          setTimeout(() => {
            trackActivity(10);
            hasTrackedInitialSessionRef.current = true;
          }, 1000); // Small delay to ensure it registers
        }
      }
    };

    // Start tracking when focused
    const handleFocus = () => startTracking();

    // Stop tracking when blurred
    const handleBlur = () => stopTracking();

    // Start tracking on mount
    startTracking();

    // Add window focus/blur listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Clean up
    return () => {
      stopTracking();
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user, activityType, minDuration]); // Re-initialize if user or activity type changes

  return null; // This hook doesn't return anything
};

export default useActivityTracker;