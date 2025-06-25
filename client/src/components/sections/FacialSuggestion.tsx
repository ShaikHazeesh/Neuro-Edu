import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/notification-context';
import { useCamera } from '@/context/camera-context';

// Types
type ContentType = 'video' | 'quiz' | 'game' | 'exercise';
interface EmotionState {
  happy: number;
  sad: number;
  angry: number;
  neutral: number;
  surprised: number;
  fearful: number;
  disgusted: number;
}

// Constants
const LS_DOMINANT_EMOTION = 'nxtwave_dominant_emotion';
const LS_EMOTION_STRENGTH = 'nxtwave_emotion_strength';
const LS_LAST_SUGGESTION_TIME = 'nxtwave_last_suggestion_time';
const LS_SUGGESTION_SHOWN = 'nxtwave_suggestion_shown';
const SUGGESTION_COOLDOWN_MS = 60000; // 1 minute cooldown

// Empty props since we'll use the global camera context
interface FacialSuggestionProps {}

const FacialSuggestion: React.FC<FacialSuggestionProps> = () => {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { emotionState, isTracking } = useCamera();
  const [suggestionShown, setSuggestionShown] = useState(false);

  // Check if we should show a suggestion (only once per session)
  const shouldShowSuggestion = (): boolean => {
    try {
      // First check if we've already shown a suggestion in this session
      const hasShownSuggestion = localStorage.getItem(LS_SUGGESTION_SHOWN) === 'true';
      if (hasShownSuggestion) {
        console.log('Suggestion already shown in this session');
        return false;
      }

      // Then check cooldown timer
      const lastSuggestionTime = localStorage.getItem(LS_LAST_SUGGESTION_TIME);
      if (!lastSuggestionTime) return true;

      const lastTime = parseInt(lastSuggestionTime, 10);
      const now = Date.now();
      const timeSinceLastSuggestion = now - lastTime;

      console.log(`Time since last suggestion: ${Math.floor(timeSinceLastSuggestion/1000)}s, Cooldown: ${SUGGESTION_COOLDOWN_MS/1000}s`);
      return timeSinceLastSuggestion > SUGGESTION_COOLDOWN_MS;
    } catch (error) {
      console.error('Error checking suggestion status:', error);
      return true;
    }
  };

  // Mark that we showed a suggestion
  const markSuggestionShown = () => {
    try {
      // Update the last suggestion time
      localStorage.setItem(LS_LAST_SUGGESTION_TIME, Date.now().toString());

      // Mark that we've shown a suggestion in this session
      localStorage.setItem(LS_SUGGESTION_SHOWN, 'true');

      setSuggestionShown(true);
      console.log('Marked suggestion as shown for this session');
    } catch (error) {
      console.error('Failed to update suggestion status:', error);
    }
  };

  // Save dominant emotion to localStorage
  const saveDominantEmotion = (emotion: keyof EmotionState, value: number) => {
    try {
      localStorage.setItem(LS_DOMINANT_EMOTION, emotion);
      localStorage.setItem(LS_EMOTION_STRENGTH, value.toString());
      console.log(`Saved dominant emotion: ${emotion} (${value})`);
    } catch (error) {
      console.error('Failed to save dominant emotion to localStorage:', error);
    }
  };

  // Get suggestion text based on content type
  const getSuggestionText = (contentType: ContentType): string => {
    switch(contentType) {
      case 'game':
        return "You seem to need a mood boost. Would you like to try a quick game?";
      case 'video':
        return "You seem focused and receptive. This is a great time for video lectures!";
      case 'quiz':
        return "You appear to be bored. Would you like to take a quiz to engage your mind?";
      case 'exercise':
        return "Ready for a break? Try some quick mental exercises to refresh.";
    }
  };

  // Show content suggestion based on emotion
  const showContentSuggestion = (contentType: ContentType, emotion: string) => {
    console.log(`Showing content suggestion: ${contentType} based on ${emotion}`);

    // Add to notification system
    addNotification({
      title: "Learning Suggestion",
      message: getSuggestionText(contentType),
      type: "info",
      action: {
        label: "Try it",
        onClick: () => {
          // Navigate based on suggestion
          switch(contentType) {
            case 'game':
              window.location.href = '/mental-health';
              break;
            case 'video':
              window.location.href = '/courses';
              break;
            case 'quiz':
              window.location.href = '/code-playground';
              break;
            case 'exercise':
              window.location.href = '/mental-health/breathing';
              break;
          }
        }
      }
    });

    // Also show toast for immediate attention
    toast({
      title: "Learning Suggestion",
      description: getSuggestionText(contentType),
      variant: "default",
      duration: 10000,
    });
  };

  // Analyze emotions and recommend content - only once per session
  const analyzeEmotionsAndRecommend = () => {
    console.log('Analyzing emotions for recommendation');

    // Skip if we've already shown a suggestion
    if (!shouldShowSuggestion()) {
      console.log('Skipping suggestion - already shown in this session');
      return;
    }

    // Find the dominant emotion if available
    if (Object.keys(emotionState).length > 0) {
      const sortedEmotions = Object.entries(emotionState)
        .sort(([, a], [, b]) => b - a);

      const dominantEmotion = sortedEmotions[0];
      const emotionName = dominantEmotion[0] as keyof EmotionState;
      const emotionStrength = dominantEmotion[1];

      console.log(`Dominant emotion: ${emotionName} (${emotionStrength})`);

      // Only recommend if emotion is strong enough
      if (emotionStrength > 0.3) { // Lower threshold to ensure we get a suggestion
        console.log(`Recommending based on ${emotionName} (${emotionStrength})`);

        // Determine content type based on emotion
        let contentType: ContentType = 'video';

        if (emotionName === 'happy' || emotionName === 'neutral') {
          contentType = 'video';
          console.log('Happy/neutral emotion detected - suggesting video content');
        } else if (emotionName === 'sad' || emotionName === 'disgusted') {
          contentType = 'game';
          console.log('Sad/disgusted emotion detected - suggesting game content');
        } else if (emotionName === 'angry' || emotionName === 'surprised' || emotionName === 'fearful') {
          contentType = 'quiz';
          console.log('Angry/surprised/fearful emotion detected - suggesting quiz content');
        } else {
          // Default to video for unknown emotions
          contentType = 'video';
          console.log('Unknown emotion - defaulting to video content');
        }

        // Save dominant emotion
        saveDominantEmotion(emotionName, emotionStrength);

        // Show suggestion
        showContentSuggestion(contentType, emotionName);

        // Mark that we showed a suggestion
        markSuggestionShown();
      } else {
        console.log(`Emotion strength (${emotionStrength}) too low for suggestion, using random suggestion`);
        generateRandomSuggestion();
      }
    } else {
      console.log('No emotion data available, generating random suggestion');
      generateRandomSuggestion();
    }
  };

  // Generate a random suggestion as fallback
  const generateRandomSuggestion = () => {
    // Available suggestion types
    const suggestionTypes: ContentType[] = ['video', 'quiz', 'game', 'exercise'];

    // Pick a random suggestion type
    const randomType = suggestionTypes[Math.floor(Math.random() * suggestionTypes.length)];

    console.log(`Generated random suggestion: ${randomType}`);

    // Show suggestion
    showContentSuggestion(randomType, 'random');

    // Mark that we showed a suggestion
    markSuggestionShown();
  };

  // Reset suggestion status on component mount
  useEffect(() => {
    // Reset the suggestion session flag on page load
    try {
      localStorage.removeItem(LS_SUGGESTION_SHOWN);
      console.log('Reset suggestion session flag');
    } catch (error) {
      console.error('Failed to reset suggestion session flag:', error);
    }
  }, []);

  // Analyze emotions and make a suggestion after a delay - only once per session
  useEffect(() => {
    // Check if we've already shown a suggestion in this session
    const hasShownSuggestion = localStorage.getItem(LS_SUGGESTION_SHOWN) === 'true';

    // Only proceed if camera is tracking, we haven't shown a suggestion yet in this component,
    // and we haven't shown a suggestion in this session
    if (isTracking && !suggestionShown && !hasShownSuggestion) {
      console.log('Camera is tracking, will analyze emotions after delay');

      // Wait for 15 seconds to collect enough facial data
      const timer = setTimeout(() => {
        console.log('Analyzing emotions after delay');
        // Double-check we still haven't shown a suggestion
        if (shouldShowSuggestion()) {
          analyzeEmotionsAndRecommend();
        } else {
          console.log('Suggestion already shown, skipping automatic analysis');
        }
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [isTracking, suggestionShown]);

  // Provide a manual trigger function for external use
  const triggerSuggestion = () => {
    // Reset suggestion status
    try {
      localStorage.removeItem(LS_SUGGESTION_SHOWN);
      setSuggestionShown(false);
    } catch (error) {
      console.error('Failed to reset suggestion status:', error);
    }

    // Trigger analysis
    analyzeEmotionsAndRecommend();
  };

  return null; // This component doesn't render anything
};

export default FacialSuggestion;
