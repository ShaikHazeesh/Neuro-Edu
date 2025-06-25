import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import MoodTrackerInput from './MoodTrackerInput';
import { loadFaceApiModels, getOptimalDetectorOptions, shouldUseSSDDetector, getSSDOptions, getEyeLandmarks, calculateDynamicEARThreshold } from '@/utils/loadModels';
import { Slider } from '@/components/ui/slider';
import { drawEyePoints, calculateEAR, smoothEAR } from '../../utils/faceDetectionHelpers';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/context/notification-context';
import FacialSuggestion from './FacialSuggestion';
import { useCamera } from '@/context/camera-context';

interface EyeTrackerProps {
  pauseActivities: () => void;
  resumeActivities: () => void;
  showDebug?: boolean;
  onEyesClosedChange: (eyesClosed: boolean) => void;
  initialThreshold?: number;
  width?: number;
  height?: number;
  mirrorVideo?: boolean;
  showExpressions?: boolean;
  deviceId?: string;
  onDetectionChange?: (isDetecting: boolean) => void;
  processingConfig?: {
    minDetections: number;
    maxFailures: number;
    scoreThreshold: number;
    confidenceThreshold: number;
  };
}

interface EmotionState {
  happy: number;
  sad: number;
  angry: number;
  neutral: number;
  surprised: number;
  fearful: number;
  disgusted: number;
}

// Define all possible emotion types for type safety
type EmotionType = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised' | 'fearful' | 'disgusted' | 'bored';

// Define all possible content suggestion types
type ContentSuggestion = 'game' | 'video' | 'quiz' | 'exercise' | null;

const EyeTracker: React.FC<EyeTrackerProps> = ({
  pauseActivities,
  resumeActivities,
  showDebug = true,
  onEyesClosedChange,
  initialThreshold = 0.2,
  width = 640,
  height = 480,
  mirrorVideo = true,
  showExpressions = false,
  deviceId = undefined,
  onDetectionChange = undefined,
  processingConfig = {
    minDetections: 5,
    maxFailures: 5,
    scoreThreshold: 0.5,
    confidenceThreshold: 0.7
  }
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  // Use the global camera context
  const {
    isModelLoaded,
    isTracking,
    videoRef,
    canvasRef,
    streamRef,
    startTracking: globalStartTracking,
    stopTracking: globalStopTracking,
    emotionState,
    setEmotionState,
    testCameraAccess
  } = useCamera();

  const [eyesClosed, setEyesClosed] = useState(false);
  const [eyesClosedTime, setEyesClosedTime] = useState(0);
  const [eyesClosedTimerId, setEyesClosedTimerId] = useState<NodeJS.Timeout | null>(null);
  const [showMoodSurvey, setShowMoodSurvey] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing eye tracking...');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [earThreshold, setEarThreshold] = useState<number>(0.25); // Increased threshold for better detection
  const [earHistory, setEarHistory] = useState<number[]>([]);
  const [eyesClosedNotificationShown, setEyesClosedNotificationShown] = useState<boolean>(false);
  // Add a ref to track if notification has been shown in this session
  const eyesClosedNotificationShownRef = useRef<boolean>(false);
  const [emotionAnalysisStartTime, setEmotionAnalysisStartTime] = useState<number | null>(null);
  const [dominantEmotionHistory, setDominantEmotionHistory] = useState<{emotion: keyof EmotionState, value: number}[]>([]);
  const maxHistoryLength = 10;
  const [baselineEAR, setBaselineEAR] = useState<number | null>(null);
  const baselineSampleCount = 20;
  const [baselineSamples, setBaselineSamples] = useState<number[]>([]);
  const [historyBuffer, setHistoryBuffer] = useState<number[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionState[]>([]);
  const [contentSuggestion, setContentSuggestion] = useState<ContentSuggestion>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [calibrated, setCalibrated] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);
  const [usingSSDDetector, setUsingSSDDetector] = useState<boolean>(false);
  const [consecutiveEyeState, setConsecutiveEyeState] = useState<number>(0);
  const [heightWidthRatio, setHeightWidthRatio] = useState<number>(0);
  const [ear, setEar] = useState<number>(0);
  const [smoothedEar, setSmoothedEar] = useState<number>(0);
  const [earValues, setEarValues] = useState<number[]>([]);
  const [detections, setDetections] = useState(0);
  const [failures, setFailures] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // Use the global refs but keep local refs for the intervals
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emotionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detection settings
  const HISTORY_SIZE = 30;
  const EMOTION_HISTORY_SIZE = 20;
  const EYE_CLOSED_DURATION_MS = 3000; // 3 seconds for eyes closed detection
  const DETECTION_INTERVAL_MS = 100;
  const EMOTION_ANALYSIS_INTERVAL_MS = 1000; // Check emotions every second
  const EMOTION_ANALYSIS_DURATION_MS = 5000; // Collect emotion data for 5 seconds
  const EMOTION_SUGGESTION_THRESHOLD = 0.2; // Even lower threshold for suggestions
  const EMOTION_CHECK_INTERVAL_MS = 5000; // Check more frequently (every 5 seconds)
  const SUGGESTION_COOLDOWN_MS = 60000; // Only suggest once per minute

  // LocalStorage keys
  const LS_EMOTION_HISTORY = 'nxtwave_emotion_history';
  const LS_LAST_SUGGESTION_TIME = 'nxtwave_last_suggestion_time';
  const LS_DOMINANT_EMOTION = 'nxtwave_dominant_emotion';
  const LS_PAGE_VISIT_COUNT = 'nxtwave_page_visit_count';
  const LS_SESSION_START_TIME = 'nxtwave_session_start_time';

  // Calculate a moving average to stabilize readings
  const calculateMovingAverage = (values: number[]): number => {
    if (values.length === 0) return 1.0;

    // Enhanced weighted average - recent values count more
    const totalWeight = values.length * (values.length + 1) / 2;
    let weightedSum = 0;

    for (let i = 0; i < values.length; i++) {
      // Weight increases linearly with recency
      const weight = i + 1;
      weightedSum += values[i] * weight;
    }

    return weightedSum / totalWeight;
  };

  // Add a value to the history buffer
  const addToHistory = (value: number) => {
    setHistoryBuffer(prev => {
      const newBuffer = [...prev, value];
      if (newBuffer.length > HISTORY_SIZE) {
        return newBuffer.slice(newBuffer.length - HISTORY_SIZE);
      }
      return newBuffer;
    });
  };

  // Add emotion state to history and localStorage
  const addEmotionToHistory = (emotion: EmotionState) => {
    setEmotionHistory(prev => {
      const newHistory = [...prev, emotion];
      const trimmedHistory = newHistory.length > EMOTION_HISTORY_SIZE
        ? newHistory.slice(newHistory.length - EMOTION_HISTORY_SIZE)
        : newHistory;

      // Save to localStorage
      try {
        localStorage.setItem(LS_EMOTION_HISTORY, JSON.stringify(trimmedHistory));
      } catch (error) {
        console.error('Failed to save emotion history to localStorage:', error);
      }

      return trimmedHistory;
    });
  };

  // Load emotion history from localStorage
  const loadEmotionHistoryFromStorage = (): EmotionState[] => {
    try {
      const storedHistory = localStorage.getItem(LS_EMOTION_HISTORY);
      if (storedHistory) {
        return JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('Failed to load emotion history from localStorage:', error);
    }
    return [];
  };

  // Save dominant emotion to localStorage
  const saveDominantEmotion = (emotion: keyof EmotionState, value: number) => {
    try {
      localStorage.setItem(LS_DOMINANT_EMOTION, JSON.stringify({ emotion, value }));
    } catch (error) {
      console.error('Failed to save dominant emotion to localStorage:', error);
    }
  };

  // Check if we should show a suggestion based on session flag and cooldown
  const shouldShowSuggestion = (): boolean => {
    try {
      // First check if we've already shown a suggestion in this session
      const hasShownSuggestion = localStorage.getItem('nxtwave_suggestion_shown') === 'true';
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
      localStorage.setItem('nxtwave_suggestion_shown', 'true');

      console.log('Marked suggestion as shown for this session');
    } catch (error) {
      console.error('Failed to update suggestion status:', error);
    }
  };

  // Track page visits
  const trackPageVisit = () => {
    try {
      // Get current visit count
      const visitCount = localStorage.getItem(LS_PAGE_VISIT_COUNT);
      const count = visitCount ? parseInt(visitCount, 10) + 1 : 1;

      // Update visit count
      localStorage.setItem(LS_PAGE_VISIT_COUNT, count.toString());
      console.log(`Page visit count: ${count}`);

      // Set session start time if not already set
      if (!localStorage.getItem(LS_SESSION_START_TIME)) {
        localStorage.setItem(LS_SESSION_START_TIME, Date.now().toString());
      }

      return count;
    } catch (error) {
      console.error('Failed to track page visit:', error);
      return 0;
    }
  };

  // Get session duration in seconds
  const getSessionDuration = (): number => {
    try {
      const startTime = localStorage.getItem(LS_SESSION_START_TIME);
      if (!startTime) {
        localStorage.setItem(LS_SESSION_START_TIME, Date.now().toString());
        return 0;
      }

      const start = parseInt(startTime, 10);
      const now = Date.now();
      return Math.floor((now - start) / 1000); // Duration in seconds
    } catch (error) {
      console.error('Failed to get session duration:', error);
      return 0;
    }
  };

  // This function has been moved below to avoid duplication



  // Test method to specifically trigger the eyes closed notification
  const testEyesClosedNotification = () => {
    console.log("Testing eyes closed notification");

    // Check if notification has already been shown in this session
    if (eyesClosedNotificationShownRef.current) {
      console.log("Eyes closed notification already shown in this session");
      setDebugInfo('Test: Eyes closed notification already shown in this session');

      // Show confirmation alert
      alert("Eyes closed notification has already been shown in this session. To test again, please refresh the page or use the Reset button.");
      return;
    }

    setDebugInfo('Test: Manually triggering eyes closed notification');

    // Reset notification flag to ensure it shows
    setEyesClosedNotificationShown(false);

    // Set the ref to true to prevent future notifications in this session
    eyesClosedNotificationShownRef.current = true;

    // Add to notification system
    addNotification({
      title: "Eyes Closed Detected",
      message: "We've noticed your eyes have been closed for 3 seconds. Do you need a break?",
      type: "warning",
      action: {
        label: "Take a Break",
        onClick: () => {
          pauseActivities();
          setShowMoodSurvey(true);
          stopTracking();
        }
      }
    });

    // Also show toast for immediate attention
    toast({
      title: "Eyes Closed Detected",
      description: "We've noticed your eyes have been closed for 3 seconds. Do you need a break?",
      variant: "destructive",
    });

    // Store in localStorage to persist across page refreshes
    try {
      localStorage.setItem('nxtwave_eyes_closed_notification_shown', 'true');
    } catch (error) {
      console.error('Failed to save notification status to localStorage:', error);
    }

    // Show the mood survey directly after a short delay
    setTimeout(() => {
      console.log("Showing mood survey from test function");
      pauseActivities();
      setShowMoodSurvey(true);
    }, 1000);
  };

  // Test method to directly show the mood survey
  const testMoodSurvey = () => {
    console.log("Directly testing mood survey dialog");
    setDebugInfo('Test: Directly showing mood survey dialog');

    // Show the mood survey
    pauseActivities();
    setShowMoodSurvey(true);

    // Show confirmation
    toast({
      title: "Mood Survey Test",
      description: "Opening the mood survey dialog for testing",
      variant: "default",
    });
  };

  // Function to trigger a time-based suggestion
  const triggerTimeBasedSuggestion = () => {
    // Get a suggestion based on visit count
    const visitCount = trackPageVisit();
    const sessionDuration = getSessionDuration();

    console.log(`Triggering time-based suggestion. Visit count: ${visitCount}, Session duration: ${sessionDuration}s`);

    // Different suggestions based on visit count and session duration
    let suggestion: ContentSuggestion;

    if (visitCount <= 2) {
      // New user - suggest video lectures
      suggestion = 'video';
    } else if (sessionDuration < 300) { // Less than 5 minutes
      // Short session - suggest quick engagement
      suggestion = Math.random() > 0.5 ? 'quiz' : 'game';
    } else {
      // Longer session - suggest variety
      const options: ContentSuggestion[] = ['video', 'quiz', 'game', 'exercise'];
      suggestion = options[Math.floor(Math.random() * options.length)];
    }

    // Show the suggestion
    setContentSuggestion(suggestion);
    setShowSuggestion(true);

    // Mark that we showed a suggestion
    markSuggestionShown();

    // Add to notification system
    addNotification({
      title: "Learning Suggestion",
      message: getSuggestionText(suggestion),
      type: "info",
      action: {
        label: "Try it",
        onClick: () => {
          // Navigate based on suggestion
          switch(suggestion) {
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
      description: getSuggestionText(suggestion),
      variant: "destructive", // More noticeable variant
      duration: 10000, // Show for 10 seconds
    });

    console.log("Time-based notification triggered for:", suggestion);

    // Hide suggestion after 15 seconds
    setTimeout(() => {
      setShowSuggestion(false);
    }, 15000);
  };

  // Load face-api models and initialize from localStorage
  useEffect(() => {
    // Track page visit
    trackPageVisit();

    // Check if eyes closed notification has already been shown
    try {
      const eyesClosedNotificationAlreadyShown = localStorage.getItem('nxtwave_eyes_closed_notification_shown') === 'true';
      if (eyesClosedNotificationAlreadyShown) {
        console.log('Eyes closed notification has already been shown in a previous session');
        eyesClosedNotificationShownRef.current = true;
        setEyesClosedNotificationShown(true);
      }
    } catch (error) {
      console.error('Failed to check eyes closed notification status:', error);
    }

    // Reset the suggestion session flags on page load
    // This ensures we can show one suggestion per page refresh
    try {
      localStorage.removeItem('nxtwave_suggestion_shown');
      localStorage.removeItem('nxtwave_facial_suggestion_shown');
      console.log('Reset suggestion session flags');
    } catch (error) {
      console.error('Failed to reset suggestion session flags:', error);
    }

    // Wait for facial data before showing a suggestion
    // We'll let the emotion analysis handle the suggestion

    // Load emotion history from localStorage
    try {
      const storedHistory = loadEmotionHistoryFromStorage();
      if (storedHistory && storedHistory.length > 0) {
        setEmotionHistory(storedHistory);
        console.log('Loaded emotion history from localStorage:', storedHistory.length, 'entries');

        // Check if we should immediately show a suggestion based on stored data
        setTimeout(() => {
          analyzeEmotionsAndRecommend(true); // Force analysis
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading emotion data from localStorage:', error);
    }

    // Start emotion analysis regardless of camera status
    // This ensures notifications work even if face detection fails
    startEmotionAnalysis();

    // Define suggestion timers
    const suggestionTimer = setTimeout(() => {
      // Show a suggestion after 30 seconds if none has been shown
      if (shouldShowSuggestion()) {
        triggerTimeBasedSuggestion();
      }
    }, 30000);

    const backupSuggestionTimer = setTimeout(() => {
      // Backup suggestion after 2 minutes
      if (shouldShowSuggestion()) {
        triggerTimeBasedSuggestion();
      }
    }, 120000);

    // Initialize face detection models
    const initModels = async () => {
      try {
        setDebugInfo('Loading face detection models...');

        // Show a toast to indicate we're loading models
        toast({
          title: "Loading Models",
          description: "Initializing face detection models. This may take a moment...",
          variant: "default",
          duration: 3000,
        });

        // Use the improved loadFaceApiModels function with multiple fallbacks
        const loaded = await loadFaceApiModels();

        if (loaded) {
          // Don't try to set isModelLoaded directly - it's managed by the camera context
          setDebugInfo('Face detection models loaded successfully!');

          // Check if camera was previously active
          const wasCameraActive = localStorage.getItem('nxtwave_camera_active') === 'true';

          if (wasCameraActive) {
            console.log('Camera was previously active, attempting to start tracking');
            // Add a slight delay to ensure models are fully initialized
            setTimeout(() => {
              startTracking();
            }, 500);
          } else {
            // Show a toast notification about camera access
            toast({
              title: "Camera Ready",
              description: "Face detection models loaded successfully. Enable camera for personalized suggestions.",
              variant: "default",
              duration: 5000,
            });
          }
        } else {
          setDebugInfo('Failed to load face detection models. Notifications will still work.');
          console.error('Failed to load face detection models');

          // Even if models fail to load, ensure notifications work
          // Start emotion analysis without face detection
          startEmotionAnalysis();

          // Show a toast notification about the issue
          toast({
            title: "Face Detection Issue",
            description: "Face detection models couldn't be loaded. You'll still receive content suggestions, but they won't be based on your facial expressions.",
            variant: "destructive",
            duration: 8000,
          });

          // Force a suggestion after a short delay
          setTimeout(() => {
            if (shouldShowSuggestion()) {
              triggerTimeBasedSuggestion();
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error initializing face models:', error);
        setDebugInfo(`Error loading models: ${error}. Notifications will still work.`);

        // Even if there's an error, ensure notifications work
        startEmotionAnalysis();

        // Show error toast
        toast({
          title: "Model Loading Error",
          description: "An error occurred while loading face detection models. Some features may be limited.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    initModels();

    // Cleanup function
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (eyesClosedTimerId) {
        clearTimeout(eyesClosedTimerId);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearTimeout(suggestionTimer);
      clearTimeout(backupSuggestionTimer);
    };
  }, []);

  // Start webcam and face tracking using the global camera context
  const startTracking = async () => {
    try {
      // Reset counters for detection tracking
      setDetections(0);
      setFailures(0);

      // Use the global startTracking function
      await globalStartTracking();

      // Add a delay to ensure video is fully initialized
      setTimeout(() => {
        // After the camera is started, initialize face detection
        if (videoRef.current && videoRef.current.srcObject) {
          console.log('Camera started successfully, initializing face detection');

          // Force load models if not already loaded
          if (!isModelLoaded) {
            console.log('Models not loaded, loading now...');
            loadFaceApiModels().then(success => {
              if (success) {
                console.log('Models loaded successfully, starting face detection');
                startFaceDetection();

                // Initialize emotion analysis loop
                startEmotionAnalysis();

                // Auto-calibrate after a short warm-up period
                setTimeout(() => {
                  if (historyBuffer.length >= 10) {
                    calibrateEAR();
                  }
                }, 5000);
              } else {
                console.error('Failed to load face detection models');
                setDebugInfo('Failed to load face detection models');
              }
            });
          } else {
            // Models already loaded, start face detection
            startFaceDetection();

            // Initialize emotion analysis loop
            startEmotionAnalysis();

            // Auto-calibrate after a short warm-up period
            setTimeout(() => {
              if (historyBuffer.length >= 10) {
                calibrateEAR();
              }
            }, 5000);
          }
        } else {
          console.warn('Camera started but video not ready');
          setDebugInfo('Camera active but video not ready');
        }
      }, 1000); // Wait 1 second for video to initialize
    } catch (error) {
      console.error('Error in startTracking:', error);
      setDebugInfo(`Failed to start tracking: ${error}. Notifications will still work.`);

      // Even if camera fails, start emotion analysis for notifications
      startEmotionAnalysis();
    }
  };

  // Calibrate EAR threshold based on user's eyes
  const calibrateEAR = () => {
    if (historyBuffer.length < 10) {
      setDebugInfo('Not enough data to calibrate');
      return;
    }

    // Sort values and take the bottom 25% as a reference for closed eyes
    const sortedValues = [...historyBuffer].sort((a, b) => a - b);
    const lowerQuartileIndex = Math.floor(sortedValues.length * 0.25);
    const lowerQuartileValue = sortedValues[lowerQuartileIndex];

    // Add a slight buffer to ensure accuracy (5% buffer)
    const newThreshold = lowerQuartileValue * 1.05;

    // Only set if it's reasonable (between 0.05 and 0.15)
    if (newThreshold >= 0.05 && newThreshold <= 0.15) {
      setEarThreshold(newThreshold);
      setDebugInfo(`Calibrated EAR threshold: ${newThreshold.toFixed(3)}`);
    }

    setCalibrated(true);
  };

  // Stop tracking using the global camera context
  const stopTracking = () => {
    console.log('Stopping tracking and cleaning up resources');

    // Clear all local intervals
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setTimeRemaining(null);
    }

    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
      emotionIntervalRef.current = null;
    }

    // Use the global stopTracking function
    globalStopTracking();

    // Update local state
    setDebugInfo('Eye tracking stopped');
  };

  // Start emotion analysis with single suggestion based on facial expressions
  const startEmotionAnalysis = () => {
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
      emotionIntervalRef.current = null;
    }

    // Initialize emotion analysis start time
    setEmotionAnalysisStartTime(Date.now());

    // Check if we've already shown a suggestion in this session
    const hasShownSuggestion = localStorage.getItem('nxtwave_facial_suggestion_shown') === 'true';
    console.log('Starting emotion analysis. Has shown facial suggestion already:', hasShownSuggestion);

    if (hasShownSuggestion) {
      console.log('Facial suggestion already shown in this session, skipping automatic facial suggestions');
      return;
    }

    // Run emotion analysis to collect data
    emotionIntervalRef.current = setInterval(() => {
      if (emotionHistory.length > 2) { // Reduced minimum requirement
        analyzeEmotionsAndRecommend();
      }
    }, EMOTION_ANALYSIS_INTERVAL_MS);

    // Create a single facial-based suggestion after collecting enough data
    const facialSuggestionTimer = setTimeout(() => {
      // Only proceed if we haven't shown a facial suggestion yet
      const hasShownFacialSuggestion = localStorage.getItem('nxtwave_facial_suggestion_shown') === 'true';
      if (!hasShownFacialSuggestion && emotionHistory.length > 0) {
        console.log("Facial-based suggestion timer triggered");

        // Get the most recent emotion data
        const recentEmotion = emotionHistory[emotionHistory.length - 1];
        const dominantEmotion = Object.entries(recentEmotion)
          .sort(([, a], [, b]) => b - a)[0][0] as keyof EmotionState;

        // Save to localStorage and force a suggestion
        saveDominantEmotion(dominantEmotion, 0.7); // Use strong confidence
        analyzeEmotionsAndRecommend(true);

        // Mark that we've shown a facial suggestion in this session
        try {
          localStorage.setItem('nxtwave_facial_suggestion_shown', 'true');
        } catch (error) {
          console.error('Failed to save facial suggestion status:', error);
        }

        // Clear the interval since we only want one facial suggestion
        if (emotionIntervalRef.current) {
          clearInterval(emotionIntervalRef.current);
          emotionIntervalRef.current = null;
        }
      }
    }, 15000); // Wait 15 seconds to collect enough facial data

    // Return cleanup function
    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      clearTimeout(facialSuggestionTimer);
    };
  };

  // Highlight the eye landmarks specifically with different colors for debugging
  const drawEyePoints = (context: CanvasRenderingContext2D, leftEye: faceapi.Point[], rightEye: faceapi.Point[]) => {
    // Draw points for left eye
    context.fillStyle = 'yellow';
    leftEye.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      context.fill();
    });

    // Draw lines connecting left eye points
    context.strokeStyle = 'yellow';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(leftEye[0].x, leftEye[0].y);
    for (let i = 1; i < leftEye.length; i++) {
      context.lineTo(leftEye[i].x, leftEye[i].y);
    }
    context.closePath();
    context.stroke();

    // Draw points for right eye
    context.fillStyle = 'cyan';
    rightEye.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      context.fill();
    });

    // Draw lines connecting right eye points
    context.strokeStyle = 'cyan';
    context.beginPath();
    context.moveTo(rightEye[0].x, rightEye[0].y);
    for (let i = 1; i < rightEye.length; i++) {
      context.lineTo(rightEye[i].x, rightEye[i].y);
    }
    context.closePath();
    context.stroke();

    // Draw vertical and horizontal lines for EAR measurement
    const drawMeasurement = (eye: faceapi.Point[], color: string) => {
      context.strokeStyle = color;
      context.lineWidth = 1;

      // Horizontal line (eye width)
      context.beginPath();
      context.moveTo(eye[0].x, eye[0].y);
      context.lineTo(eye[3].x, eye[3].y);
      context.stroke();

      // Vertical lines (eye height)
      context.beginPath();
      context.moveTo(eye[1].x, eye[1].y);
      context.lineTo(eye[5].x, eye[5].y);
      context.stroke();

      context.beginPath();
      context.moveTo(eye[2].x, eye[2].y);
      context.lineTo(eye[4].x, eye[4].y);
      context.stroke();
    };

    drawMeasurement(leftEye, 'orange');
    drawMeasurement(rightEye, 'magenta');
  };

  // Analyze emotion trends and recommend content
  const analyzeEmotionsAndRecommend = (forceAnalysis = false) => {
    if (emotionHistory.length === 0) return;

    // If we're not currently collecting emotion data, start now
    if (emotionAnalysisStartTime === null && !forceAnalysis) {
      setEmotionAnalysisStartTime(Date.now());
      setDominantEmotionHistory([]);
      return;
    }

    // Check if we've been collecting data for the required duration or if forced
    const now = Date.now();
    const elapsedTime = emotionAnalysisStartTime ? now - emotionAnalysisStartTime : 0;
    const shouldAnalyze = forceAnalysis || elapsedTime >= EMOTION_ANALYSIS_DURATION_MS;

    if (!shouldAnalyze && !forceAnalysis) return;

    // Calculate average emotions over recent history
    const avgEmotion: EmotionState = {
      happy: 0, sad: 0, angry: 0, neutral: 0, surprised: 0, fearful: 0, disgusted: 0
    };

    emotionHistory.forEach(emotion => {
      Object.keys(emotion).forEach(key => {
        const emotionKey = key as keyof EmotionState;
        avgEmotion[emotionKey] += emotion[emotionKey] / emotionHistory.length;
      });
    });

    // Determine dominant emotion
    const sortedEmotions = Object.entries(avgEmotion)
      .sort(([, a], [, b]) => b - a);

    const dominantEmotion = sortedEmotions[0][0] as keyof EmotionState;
    const dominantValue = sortedEmotions[0][1];

    // Save dominant emotion to localStorage
    saveDominantEmotion(dominantEmotion, dominantValue);

    // Add to dominant emotion history
    setDominantEmotionHistory(prev => {
      const newHistory = [...prev, { emotion: dominantEmotion, value: dominantValue }];
      return newHistory;
    });

    // Reset the analysis start time for next cycle if not forced
    if (!forceAnalysis && emotionAnalysisStartTime !== null) {
      setEmotionAnalysisStartTime(null);
    }

    // Count occurrences of each emotion in the history
    const emotionCounts: Record<keyof EmotionState, { count: number, totalValue: number }> = {
      happy: { count: 0, totalValue: 0 },
      sad: { count: 0, totalValue: 0 },
      angry: { count: 0, totalValue: 0 },
      neutral: { count: 0, totalValue: 0 },
      surprised: { count: 0, totalValue: 0 },
      fearful: { count: 0, totalValue: 0 },
      disgusted: { count: 0, totalValue: 0 }
    };

    // Use both current dominant emotion history and the current dominant emotion
    const combinedHistory = [
      ...dominantEmotionHistory,
      { emotion: dominantEmotion, value: dominantValue }
    ];

    combinedHistory.forEach(item => {
      emotionCounts[item.emotion].count++;
      emotionCounts[item.emotion].totalValue += item.value;
    });

    // Find the most frequent dominant emotion
    let mostFrequentEmotion: keyof EmotionState = 'neutral';
    let highestCount = 0;
    let highestAvgValue = 0;

    Object.entries(emotionCounts).forEach(([emotion, data]) => {
      if (data.count > highestCount) {
        mostFrequentEmotion = emotion as keyof EmotionState;
        highestCount = data.count;
        highestAvgValue = data.count > 0 ? data.totalValue / data.count : 0;
      } else if (data.count === highestCount && data.count > 0) {
        // If tied, use the one with higher average value
        const avgValue = data.totalValue / data.count;
        if (avgValue > highestAvgValue) {
          mostFrequentEmotion = emotion as keyof EmotionState;
          highestAvgValue = avgValue;
        }
      }
    });

    // Check if we should show a suggestion (based on cooldown)
    const canShowSuggestion = shouldShowSuggestion();

    // Check if we've already shown a facial suggestion in this session
    const hasShownFacialSuggestion = localStorage.getItem('nxtwave_facial_suggestion_shown') === 'true';

    // Debug info
    setDebugInfo(`Emotion: ${mostFrequentEmotion} (${(highestAvgValue * 100).toFixed(0)}%) - Can suggest: ${canShowSuggestion && !hasShownFacialSuggestion ? 'Yes' : 'No'}`);

    // Only suggest if we have enough data, are past the cooldown period, and haven't shown a facial suggestion yet
    if (highestAvgValue > EMOTION_SUGGESTION_THRESHOLD && canShowSuggestion && (!hasShownFacialSuggestion || forceAnalysis)) {
      let suggestion: ContentSuggestion = null;
      console.log("Emotion strong enough for suggestion:", mostFrequentEmotion, highestAvgValue);

      // Determine suggestion based on emotion using type-safe approach
      const emotionToSuggestion = (emotion: string): ContentSuggestion => {
        if (emotion === 'sad' || emotion === 'fearful' || emotion === 'disgusted') {
          return 'game'; // Suggest game to improve mood
        } else if (emotion === 'happy') {
          return 'video'; // Suggest video lectures when in good mood
        } else if (emotion === 'neutral') {
          // For neutral, randomly suggest either video or quiz to keep things interesting
          return Math.random() > 0.5 ? 'video' : 'quiz';
        } else if (emotion === 'bored') {
          return 'quiz'; // Suggest quiz for engagement
        } else if (emotion === 'surprised' || emotion === 'angry') {
          return 'quiz'; // Suggest quiz for engagement
        } else {
          // Default to video if we can't determine
          return 'video';
        }
      };

      // Get the suggestion based on the emotion
      suggestion = emotionToSuggestion(mostFrequentEmotion);

      if (suggestion) {
        // Mark that we showed a suggestion to prevent spam
        markSuggestionShown();

        // Also mark that we've shown a facial suggestion in this session
        try {
          localStorage.setItem('nxtwave_facial_suggestion_shown', 'true');
        } catch (error) {
          console.error('Failed to save facial suggestion status:', error);
        }

        setContentSuggestion(suggestion);
        setShowSuggestion(true);

        // Add to notification system with more prominent styling
        addNotification({
          title: "Learning Suggestion",
          message: getSuggestionText(suggestion),
          type: "info",
          action: {
            label: "Try it",
            onClick: () => {
              // Navigate to appropriate content based on suggestion
              switch(suggestion) {
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

        // Also show toast for immediate attention with more prominent styling
        toast({
          title: "Learning Suggestion",
          description: getSuggestionText(suggestion),
          variant: "destructive", // More noticeable variant
          duration: 10000, // Show for 10 seconds
        });

        // Log for debugging
        console.log("Notification triggered for:", suggestion);

        // Hide suggestion after 15 seconds
        setTimeout(() => {
          setShowSuggestion(false);
        }, 15000);
      }
    }

    // If not forced, clear the history for the next analysis cycle
    if (!forceAnalysis) {
      setDominantEmotionHistory([]);
    }
  };

  // Start face detection interval with improved accuracy and fallback mechanism
  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) {
      setDebugInfo('Cannot start face detection: Video or canvas element not available');
      return;
    }

    // Clear any existing detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video dimensions are set correctly
    const displaySize = { width: video.videoWidth || video.width, height: video.videoHeight || video.height };
    console.log('Setting up face detection with display size:', displaySize);

    // Match canvas dimensions to video
    faceapi.matchDimensions(canvas, displaySize);

    // Log that face detection is starting
    console.log('Starting face detection interval');
    setDebugInfo('Face detection starting...');

    // Run detection at regular intervals
    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.paused || video.ended || !video.srcObject) {
        setDebugInfo('Video stream paused, ended, or not available');
        return;
      }

      // Check if video is ready
      if (video.readyState !== 4) {
        console.log('Video not ready yet, readyState:', video.readyState);
        return;
      }

      try {
        let detections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[] = [];

        // Get detector options based on video dimensions
        const detectorOptions = getOptimalDetectorOptions(video.width, video.height);

        // Check if we should use the more accurate SSD detector
        const shouldUseSSD = shouldUseSSDDetector(
          0.5, // Default device performance value
          detections.length, // Number of detections
          failures || 0
        );

        // If we're not already using SSD and should be, switch to it
        if (shouldUseSSD && !usingSSDDetector) {
          setUsingSSDDetector(true);
        }

        // Always try both detectors to ensure we get a result
        let tinyDetections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[] = [];
        let ssdDetections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[] = [];

        // Try SSD MobileNet first (more accurate but slower)
        try {
          // Create a custom SSD option with very low threshold for better detection
          const ssdOptions = new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.2, // Very low threshold to detect even in poor conditions
            maxResults: 3 // Allow multiple faces
          });

          ssdDetections = await faceapi
            .detectAllFaces(video, ssdOptions)
            .withFaceLandmarks()
            .withFaceExpressions();

          console.log('SSD MobileNet found', ssdDetections.length, 'faces');

          // If SSD found faces, use those results
          if (ssdDetections.length > 0) {
            setUsingSSDDetector(true);
            detections = ssdDetections;
          }
        } catch (ssdError) {
          console.error('SSD MobileNet error:', ssdError);
        }

        // If SSD failed or found no faces, try TinyFaceDetector
        if (ssdDetections.length === 0) {
          try {
            // Create a custom TinyFaceDetector with very low threshold
            const tinyOptions = new faceapi.TinyFaceDetectorOptions({
              inputSize: 416, // Larger input size for better accuracy
              scoreThreshold: 0.2 // Very low threshold to detect even in poor conditions
            });

            // Try with TinyFaceDetector (faster)
            tinyDetections = await faceapi
              .detectAllFaces(video, tinyOptions)
              .withFaceLandmarks()
              .withFaceExpressions();

            console.log('TinyFaceDetector found', tinyDetections.length, 'faces');

            // If TinyFaceDetector found faces, use those results
            if (tinyDetections.length > 0) {
              setUsingSSDDetector(false);
              detections = tinyDetections;
            }
          } catch (tinyError) {
            console.error('TinyFaceDetector error:', tinyError);
          }
        }

        // If both failed, try one more time with extremely low threshold
        if ((!detections || detections.length === 0) && consecutiveFailures > 2) {
          try {
            console.log('Both detectors failed, trying with extremely low threshold');
            // Create a custom SSD option with extremely low threshold
            const lastResortOptions = new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.1, // Extremely low threshold to detect in any condition
              maxResults: 10 // Allow many potential faces
            });

            const lastResortDetections = await faceapi
              .detectAllFaces(video, lastResortOptions)
              .withFaceLandmarks()
              .withFaceExpressions();

            if (lastResortDetections.length > 0) {
              console.log('Last resort detection found', lastResortDetections.length, 'faces');

              // Sort by confidence and take the highest one
              const sortedDetections = lastResortDetections.sort(
                (a, b) => b.detection.score - a.detection.score
              );

              detections = [sortedDetections[0]]; // Use only the highest confidence detection
              setUsingSSDDetector(true);
            }
          } catch (lastError) {
            console.error('Last resort detection error:', lastError);
          }
        }

        // If all detection methods failed, try direct pixel analysis as absolute last resort
        if (!detections || detections.length === 0) {
          try {
            // Get video dimensions
            const videoWidth = video.videoWidth || video.width;
            const videoHeight = video.videoHeight || video.height;

            // Create a temporary canvas to analyze video pixels
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoWidth;
            tempCanvas.height = videoHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Only proceed if we have a valid context
            if (tempCtx) {
              // Draw current video frame to canvas
              tempCtx.drawImage(video, 0, 0, videoWidth, videoHeight);

              // Get center region of the video (where face likely is)
              const centerX = Math.floor(videoWidth / 2);
              const centerY = Math.floor(videoHeight / 2);
              const regionSize = Math.min(videoWidth, videoHeight) / 3;

              // Analyze pixel data in center region
              const imageData = tempCtx.getImageData(
                centerX - regionSize/2,
                centerY - regionSize/2,
                regionSize,
                regionSize
              );

              // Continue with the analysis
              // Check if there's significant pixel variation (indicating a face might be present)
              let totalVariation = 0;
              const data = imageData.data;

              for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel (RGBA)
                if (i + 8 < data.length) {
                  // Calculate difference between adjacent pixels
                  const diff = Math.abs(data[i] - data[i+4]) +
                               Math.abs(data[i+1] - data[i+5]) +
                               Math.abs(data[i+2] - data[i+6]);
                  totalVariation += diff;
                }
              }

              // If there's significant variation, assume a face might be present
              const avgVariation = totalVariation / (data.length / 16);
              console.log('Pixel variation analysis:', avgVariation);

              if (avgVariation > 30) { // Threshold for significant variation
                console.log('Pixel analysis suggests a face might be present');
                // Don't create fake detections, but reduce failure count
                setConsecutiveFailures(Math.max(0, consecutiveFailures - 1));
              }
            } else {
              console.error('Failed to get 2D context from temporary canvas');
            }


          } catch (pixelError) {
            console.error('Pixel analysis error:', pixelError);
          }
        }

        // Use TinyFaceDetector results if available and SSD didn't find anything
        if (tinyDetections.length > 0 && ssdDetections.length === 0) {
          setUsingSSDDetector(false);
          detections = tinyDetections;
        }

        // If both failed, use an empty array
        if (!detections) {
          detections = [];
        }

        // Process detection results
        if (detections.length > 0) {
          // Reset failure counter on successful detection
          setConsecutiveFailures(0);
          setDetections(prev => prev + 1);

          // Calculate proper confidence value (0.0-1.0)
          const rawConfidence = detections[0].detection.score;
          // Map detector confidence (typically 0.5-1.0) to full range (0-1)
          const normalizedConfidence = Math.min(1, Math.max(0, (rawConfidence - 0.5) * 2));
          setDetectionConfidence(normalizedConfidence);

          // If SSD detector is working well, consider switching back to TinyFace
          if (usingSSDDetector && normalizedConfidence > 0.8) {
            // After 5 successful high-confidence detections, try switching back
            // This helps maintain performance while ensuring accuracy
            setUsingSSDDetector(false);
          }
        } else {
          // Increment failure counter when no face detected
          setConsecutiveFailures(prev => prev + 1);
          setFailures(prev => prev + 1);
          setDetectionConfidence(0);
        }

        // Clear previous drawings
        const context = canvas.getContext('2d');
        if (!context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detections
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        if (showDebug) {
          // Only show basic detection, not default landmarks (we'll draw our custom ones)
          faceapi.draw.drawDetections(canvas, resizedDetections);
        }

        // Check if eyes are closed with enhanced detection
        if (detections.length > 0) {
          const detection = resizedDetections[0];
          const landmarks = detection.landmarks;
          const expressions = detection.expressions;

          // Extract eye landmarks using the utility function
          const { leftEye, rightEye } = getEyeLandmarks(landmarks);

          // Calculate EAR for each eye using the enhanced utility function
          const leftEAR = calculateEAR(landmarks, leftEye);
          const rightEAR = calculateEAR(landmarks, rightEye);

          // Average the EAR values
          const avgEAR = (leftEAR + rightEAR) / 2;

          // Apply smoothing with weighted values
          const { smoothedValue, updatedValues } = smoothEAR(avgEAR, earValues);

          // Update state
          setEarValues(updatedValues);
          setEar(avgEAR);
          setSmoothedEar(smoothedValue);

          // Get face dimensions for dynamic threshold calculation
          const faceBox = detection.detection.box;
          const faceWidth = faceBox.width;
          const faceHeight = faceBox.height;

          // Calculate dynamic EAR threshold based on face proportions
          const dynamicThreshold = calculateDynamicEARThreshold(
            faceWidth,
            faceHeight,
            initialThreshold
          );

          // Update threshold if it's significantly different
          if (Math.abs(dynamicThreshold - earThreshold) > 0.02) {
            setEarThreshold(dynamicThreshold);
          }

          // Apply emotion smoothing for more realistic values with stronger weighting
          // Blend with previous emotion data for stability (85% new, 15% old)
          // This makes the system more responsive to current emotions
          const smoothedEmotions: EmotionState = { ...emotionState };

          // First, check if we have valid expression data
          const hasValidExpressions = Object.values(expressions).some(value => value > 0);

          if (hasValidExpressions) {
            // Log the raw expressions for debugging
            console.log('Raw expressions:', Object.entries(expressions)
              .map(([key, value]) => `${key}: ${(value * 100).toFixed(0)}%`)
              .join(', '));

            // Apply smoothing with stronger weight to current emotions
            Object.keys(expressions).forEach(key => {
              const emotionKey = key as keyof EmotionState;
              smoothedEmotions[emotionKey] = expressions[emotionKey] * 0.85 + (emotionState[emotionKey] || 0) * 0.15;
            });

            // Boost the strongest emotion slightly to make it more pronounced
            const strongestEmotion = Object.entries(smoothedEmotions)
              .sort(([, a], [, b]) => b - a)[0][0] as keyof EmotionState;

            if (smoothedEmotions[strongestEmotion] > 0.3) {
              smoothedEmotions[strongestEmotion] = Math.min(1, smoothedEmotions[strongestEmotion] * 1.2);
            }
          } else {
            console.warn('No valid expression data detected');
          }

          // Update state
          setEmotionState(smoothedEmotions);
          setDetectionConfidence(detection.detection.score || 0);
          setConsecutiveFailures(0);
          setConsecutiveEyeState(prev => prev + 1);
          setHeightWidthRatio(faceHeight / faceWidth);

          // Improved eye state detection with confidence weighting
          const isEyesClosed = smoothedValue < earThreshold;

          // Log the current EAR value and threshold for debugging
          console.log(`Current EAR: ${smoothedValue.toFixed(3)}, Threshold: ${earThreshold.toFixed(3)}, Eyes Closed: ${isEyesClosed}`);

          // Add confidence weight - lower confidence means we're less certain about eye state
          // This is intentionally unused but kept for future reference
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const confidenceWeight = Math.min(1, detectionConfidence * 1.5); // Scale up but cap at 1

          // Always update eye state regardless of confidence
          // This ensures we detect closed eyes even with lower confidence

          // Update the consecutive eye state counter
          if (isEyesClosed === eyesClosed) {
            setConsecutiveEyeState(prev => prev + 1);
          } else {
            setConsecutiveEyeState(1);
          }

          // Inform parent component of the eye state change
          setEyesClosed(isEyesClosed);

          // Call the callback safely with proper TypeScript syntax
          if (onEyesClosedChange !== undefined) {
            onEyesClosedChange(isEyesClosed);
          }

          // Debug drawing if canvas is available
          if (showDebug && canvasRef.current) {
            drawEyePoints(context, leftEye, rightEye);
          }

          // Update debug info with more comprehensive information
          setDebugInfo(`Face Detected: YES
                        Detector: ${usingSSDDetector ? 'SSD MobileNet (Accurate)' : 'TinyFace (Fast)'}
                        EAR: ${smoothedEar.toFixed(3)}
                        Threshold: ${earThreshold.toFixed(3)}
                        Confidence: ${(detectionConfidence * 100).toFixed(0)}%
                        Detection Rate: ${(detections.length / (detections.length + consecutiveFailures) * 100).toFixed(0)}%
                        Dominant Emotion: ${Object.entries(smoothedEmotions)
                          .sort(([, a], [, b]) => b - a)[0][0]} (${(Object.entries(smoothedEmotions)
                          .sort(([, a], [, b]) => b - a)[0][1] * 100).toFixed(0)}%)`);

          // Also log to console for debugging
          console.log(`Face detected with ${(detectionConfidence * 100).toFixed(0)}% confidence using ${usingSSDDetector ? 'SSD' : 'TinyFace'} detector`);

          // Draw eye state indicator
          if (showDebug) {
            context.font = '24px Arial';
            context.fillStyle = isEyesClosed ? 'red' : 'green';
            context.fillText(isEyesClosed ? 'EYES CLOSED' : 'EYES OPEN', 20, 30);

            // Show dominant emotion with confidence
            const sortedEmotions = Object.entries(smoothedEmotions)
              .sort(([, a], [, b]) => b - a);

            const dominantEmotion = sortedEmotions[0];
            const secondaryEmotion = sortedEmotions[1];

            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.fillText(`Emotion: ${dominantEmotion[0]} (${(dominantEmotion[1] * 100).toFixed(0)}%)`, 20, 60);

            // Show secondary emotion if it's significant (>15%)
            if (secondaryEmotion[1] > 0.15) {
              context.fillText(`+ ${secondaryEmotion[0]} (${(secondaryEmotion[1] * 100).toFixed(0)}%)`, 20, 80);
            }
          }

          // Handle eye closure state with improved timing
          if (isEyesClosed) {
            // Eyes are closed - check if this is a new closure or continuing
            if (!eyesClosed) {
              // Eyes just closed - start the timer
              const currentTime = Date.now();
              setEyesClosedTime(currentTime);
              setTimeRemaining(EYE_CLOSED_DURATION_MS / 1000);
              setDebugInfo('Eyes closed! Starting timer...');
              console.log('Eyes closed detected at:', new Date(currentTime).toISOString());

              // Start countdown timer
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }

              countdownIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const elapsed = now - eyesClosedTime;
                const remaining = Math.max(0, Math.ceil((EYE_CLOSED_DURATION_MS - elapsed) / 1000));

                setTimeRemaining(remaining);
                console.log('Eyes closed countdown:', remaining, 'seconds remaining');

                if (remaining <= 0 && countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                  console.log('Countdown completed');
                }
              }, 1000);

              // Start timer for specified duration
              const timerId = setTimeout(() => {
                // Check if eyes are still closed
                console.log('Eyes closed timer completed. Current eye state:', isEyesClosed ? 'closed' : 'open');
                setDebugInfo(`Eyes closed for ${EYE_CLOSED_DURATION_MS/1000}+ seconds.`);

                // Force show notification regardless of current state
                // This ensures the notification shows even if face detection is intermittent
                if (!eyesClosedNotificationShown && !eyesClosedNotificationShownRef.current) {
                  console.log('Showing eyes closed notification - first time in this session');

                  // Set the ref to true to prevent future notifications in this session
                  eyesClosedNotificationShownRef.current = true;

                  // Add to notification system
                  addNotification({
                    title: "Eyes Closed Detected",
                    message: "We've noticed your eyes have been closed for 3 seconds. Do you need a break?",
                    type: "warning",
                    action: {
                      label: "Take a Break",
                      onClick: () => {
                        pauseActivities();
                        setShowMoodSurvey(true);
                        stopTracking();
                      }
                    }
                  });

                  // Also show toast for immediate attention
                  toast({
                    title: "Eyes Closed Detected",
                    description: "We've noticed your eyes have been closed for 3 seconds. Do you need a break?",
                    variant: "destructive",
                  });

                  setEyesClosedNotificationShown(true);

                  // Show the mood survey immediately
                  console.log("Showing mood survey after eyes closed notification");
                  pauseActivities();
                  setShowMoodSurvey(true);
                  stopTracking(); // Temporarily stop tracking

                  // Show a toast to ensure the user knows what's happening
                  toast({
                    title: "Mood Survey",
                    description: "Please complete the mood survey to continue.",
                    variant: "default",
                  });

                  // Store in localStorage to persist across page refreshes
                  try {
                    localStorage.setItem('nxtwave_eyes_closed_notification_shown', 'true');
                  } catch (error) {
                    console.error('Failed to save notification status to localStorage:', error);
                  }
                } else {
                  console.log('Eyes closed notification already shown in this session, skipping');
                }
              }, EYE_CLOSED_DURATION_MS);

              setEyesClosedTimerId(timerId);
            }
          } else if (!isEyesClosed && eyesClosed) {
            // Eyes just opened
            setEyesClosed(false);
            setTimeRemaining(null);
            setDebugInfo('Eyes opened. Resetting timer.');

            // Reset notification flag
            setEyesClosedNotificationShown(false);

            // Clear the timers
            if (eyesClosedTimerId) {
              clearTimeout(eyesClosedTimerId);
              setEyesClosedTimerId(null);
            }

            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
          }
        } else {
          // No face detected
          setDebugInfo(`Face Detected: NO
                        Consecutive Failures: ${consecutiveFailures}
                        Try adjusting your position, lighting, or camera angle.
                        Make sure your face is clearly visible and well-lit.`);

          // Log to console for debugging
          console.log(`No face detected. Consecutive failures: ${consecutiveFailures}`);

          // Important: Don't clear the eye closed timer when face detection fails
          // This ensures the notification will still show even if face detection is intermittent
          // Only clear the countdown display timer
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            setTimeRemaining(null);
          }

          // Don't reset eyesClosed state here to ensure the timer continues to work
          // This is a key fix to ensure notifications work even with low confidence

          // If we've had many consecutive failures, show a toast with troubleshooting tips
          if (consecutiveFailures === 10) {
            toast({
              title: "Face Detection Issue",
              description: "Having trouble detecting your face. Try adjusting lighting, camera angle, or position.",
              variant: "default",
              duration: 5000,
            });
          }
        }
      } catch (err) {
        // Type guard for the error
        const error = err instanceof Error
          ? err
          : new Error(String(err));

        console.error('Face detection error:', error);
        setDebugInfo(`Detection error: ${error.message}`);
        // Increment failure counter on error
        setConsecutiveFailures(prev => prev + 1);
      }
    }, 100); // Run detection every 100ms for smooth performance
  };

  // Dynamic threshold adjustment
  // This function is intentionally unused but kept for future reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateEarThreshold = useCallback((faceWidth: number, faceHeight: number) => {
    const dynamicThreshold = calculateDynamicEARThreshold(
      faceWidth,
      faceHeight,
      initialThreshold
    );
    setEarThreshold(dynamicThreshold);
  }, [initialThreshold]);

  // Euclidean distance between two points
  // This function is intentionally unused but kept for future reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const distance = (p1: faceapi.Point, p2: faceapi.Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Handle mood survey completion
  const handleMoodSubmitted = () => {
    console.log("Mood survey submitted, closing dialog and resuming activities");

    // Close the mood survey dialog
    setShowMoodSurvey(false);

    // Don't reset the notification flag - we still want to prevent multiple notifications
    // in the same session, but we do want to allow the mood survey to be shown again if needed

    // Resume tracking and activities
    startTracking(); // Resume tracking
    resumeActivities(); // Resume website activities
    setDebugInfo('Mood survey completed. Resuming activities.');

    // Add to notification system
    addNotification({
      title: "Thank you!",
      message: "Your feedback helps us provide better learning suggestions.",
      type: "success"
    });

    // Also show toast for immediate feedback
    toast({
      title: "Thank you!",
      description: "Your feedback helps us provide better learning suggestions.",
      variant: "default",
    });
  };

  // Handle threshold changes
  const handleThresholdChange = (value: number[]) => {
    setEarThreshold(value[0]);
  };

  // Auto-start tracking if user is logged in and models are loaded
  useEffect(() => {
    if (user && isModelLoaded && !isTracking) {
      setDebugInfo('User logged in and models loaded. Starting tracking...');

      // Check if camera was previously active
      const wasCameraActive = localStorage.getItem('nxtwave_camera_active') === 'true';

      if (wasCameraActive) {
        // If camera was previously active, try to start tracking
        startTracking();
      } else {
        // If camera wasn't active before, just start emotion analysis for notifications
        // without requesting camera access
        setDebugInfo('Starting without camera. Notifications will still work.');
        startEmotionAnalysis();

        // Show a toast notification about camera access
        toast({
          title: "Camera Access",
          description: "Enable camera access for personalized content suggestions. Click the camera icon to enable.",
          variant: "default",
          duration: 5000,
        });
      }
    }
  }, [user, isModelLoaded]);

  // Force a notification after a short delay regardless of camera status
  useEffect(() => {
    // Wait 15 seconds then trigger a time-based suggestion
    const forcedSuggestionTimer = setTimeout(() => {
      if (shouldShowSuggestion()) {
        console.log("Forced initial suggestion triggered");
        triggerTimeBasedSuggestion();
      }
    }, 15000);

    return () => clearTimeout(forcedSuggestionTimer);
  }, []);

  // Get content suggestion text
  const getSuggestionText = (suggestion: ContentSuggestion = contentSuggestion) => {
    switch(suggestion) {
      case 'game':
        return "You seem to need a mood boost. Would you like to try a quick game?";
      case 'video':
        return "You seem focused and receptive. This is a great time for video lectures!";
      case 'quiz':
        return "You appear to be bored. Would you like to take a quiz to engage your mind?";
      case 'exercise':
        return "Ready for a break? Try some quick mental exercises to refresh.";
      default:
        return "";
    }
  };

  // This function is not being used and has undefined variables
  // Commenting it out to fix the build error
  /*
  const detect = useCallback(async () => {
    if (!videoRef.current || !isModelLoaded || !isTracking) return;

    try {
      // Measure performance start time
      const startTime = performance.now();

      // Determine which detector to use based on device performance
      const shouldUseSSD = shouldUseSSDDetector(
        0.5, // devicePerformance placeholder
        detections,
        failures
      );

      if (shouldUseSSD !== usingSSDDetector) {
        setUsingSSDDetector(shouldUseSSD);
      }

      // Get the appropriate detector options
      const detectorOptions = getOptimalDetectorOptions(640, 480);

      // Run face detection with the chosen detector
      const detectionResults = await faceapi
        .detectSingleFace(videoRef.current, detectorOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

      // Measure performance end time
      const endTime = performance.now();
      const detectionTime = endTime - startTime;

      // Update device performance based on detection time
      // Lower times means better performance - normalize to 0-1 range
      const normalizedPerformance = Math.min(1, 80 / detectionTime);
      // setDevicePerformance(prev => prev * 0.7 + normalizedPerformance * 0.3);

      if (detectionResults) {
        // Success - update consecutive detection counters
        setDetections(prev => prev + 1);
        setConsecutiveFailures(0);

        // If we now have enough consecutive detections, set as detecting
        if (onDetectionChange && detections >= processingConfig.minDetections) {
          onDetectionChange(true);
        }

        // Extract face dimensions for dynamic thresholding
        const faceBox = detectionResults.detection.box;
        updateEarThreshold(faceBox.width, faceBox.height);

        // Get eye landmarks
        const { leftEye, rightEye } = getEyeLandmarks(detectionResults.landmarks);

        // Calculate EAR values for both eyes
        const leftEAR = calculateEAR(detectionResults.landmarks, leftEye);
        const rightEAR = calculateEAR(detectionResults.landmarks, rightEye);

        // Take the average of both eyes for better stability
        const avgEAR = (leftEAR + rightEAR) / 2;

        // Get the detection confidence
        const confidence = detectionResults.detection.score;
        setDetectionConfidence(confidence);

        // Apply smoothing to the EAR value
        const { smoothedValue, updatedValues } = smoothEAR(
          avgEAR,
          earValues,
          5, // Window size
          0.4 // Current weight
        );

        // Update EAR values
        setEarValues(updatedValues);
        setEar(avgEAR);
        setSmoothedEar(smoothedValue);

        // Determine if eyes are closed based on smoothed value and threshold
        const isEyesClosed = smoothedValue < earThreshold;

        // Only change eye state if confidence is reasonable or we've consistently detected the same state
        const confidenceWeight = Math.min(1, confidence * 1.5); // Scale up confidence but cap at 1

        if (confidenceWeight > 0.4 || consecutiveEyeState > 3) {
          // Update the consecutive eye state counter
          if (isEyesClosed === eyesClosed) {
            setConsecutiveEyeState(prev => prev + 1);
          } else {
            setConsecutiveEyeState(1);
          }

          // Update eye state and inform parent component
          setEyesClosed(isEyesClosed);
        }
      }
    } catch (error) {
      console.error('Error in detection:', error);
    }
  }, [earThreshold, earValues, eyesClosed, onEyesClosedChange, processingConfig]);
  */

  // Check if camera is active from localStorage
  // This function is intentionally unused but kept for future reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isCameraActive = () => {
    try {
      return localStorage.getItem('nxtwave_camera_active') === 'true';
    } catch (error) {
      return false;
    }
  };



  return (
    <div className="eye-tracker">
      {/* Camera activation banner - shown when camera is not active */}
      {!isTracking && (
        <div className="fixed top-16 left-0 right-0 bg-red-100 dark:bg-red-900 p-4 z-[9999] flex justify-between items-center shadow-lg border-b-2 border-red-500">
          <div className="flex items-center">
            <span className="material-icons text-red-600 dark:text-red-400 mr-2 text-2xl">videocam_off</span>
            <div>
              <h3 className="font-medium text-lg">Camera not active</h3>
              <p className="text-sm">Enable camera access for personalized content suggestions based on your engagement.</p>
              <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                <span className="material-icons text-xs align-middle mr-1">info</span>
                If you've previously denied camera access, you may need to reset permissions in your browser settings.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              onClick={() => {
                // Reset camera status in localStorage first
                try {
                  localStorage.removeItem('nxtwave_camera_active');
                } catch (error) {
                  console.error('Failed to reset camera status:', error);
                }

                // Then try to start tracking
                startTracking();
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2"
              size="lg"
            >
              <span className="material-icons mr-1">videocam</span>
              Enable Camera
            </Button>

          </div>
        </div>
      )}

      {/* Always visible control buttons */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
        {/* Suggestion button - provides random suggestions without reloading */}
        <Button
          variant="default"
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white shadow-lg"
          onClick={() => {
            // Generate a random suggestion
            const generateRandomSuggestion = () => {
              // Available suggestion types
              const suggestionTypes = ['video', 'quiz', 'game', 'exercise'] as const;

              // Pick a random suggestion type
              const randomType = suggestionTypes[Math.floor(Math.random() * suggestionTypes.length)];

              // Get suggestion text based on type
              let suggestionText = "";
              switch(randomType) {
                case 'game':
                  suggestionText = "Take a break with a quick game to boost your mood!";
                  break;
                case 'video':
                  suggestionText = "This is a great time to watch some video lectures!";
                  break;
                case 'quiz':
                  suggestionText = "Challenge yourself with a quiz to engage your mind!";
                  break;
                case 'exercise':
                  suggestionText = "Try some quick mental exercises to refresh your mind!";
                  break;
              }

              // Show toast notification
              toast({
                title: "Learning Suggestion",
                description: suggestionText,
                variant: "default",
                duration: 8000,
              });

              // Add to notification system
              addNotification({
                title: "Learning Suggestion",
                message: suggestionText,
                type: "info",
                action: {
                  label: "Try it",
                  onClick: () => {
                    // Navigate based on suggestion
                    switch(randomType) {
                      case 'game':
                        window.location.href = '/mental-health';
                        break;
                      case 'video':
                        window.location.href = '/courses';
                        break;
                      case 'quiz':
                      case 'exercise':
                        window.location.href = '/code-playground';
                        break;
                    }
                  }
                }
              });

              console.log(`Generated random suggestion: ${randomType}`);
            };

            // If camera is tracking and we have emotion data, use it to influence the suggestion
            // Otherwise, just generate a completely random suggestion
            if (isTracking && Object.keys(emotionState).length > 0) {
              // Find the dominant emotion
              const sortedEmotions = Object.entries(emotionState)
                .sort(([, a], [, b]) => b - a);

              const dominantEmotion = sortedEmotions[0][0] as keyof EmotionState;
              const strength = sortedEmotions[0][1];

              console.log(`Manual suggestion using dominant emotion: ${dominantEmotion} (${strength})`);

              // Show toast to confirm
              toast({
                title: "Analyzing Your Mood",
                description: "Creating a personalized learning suggestion...",
                variant: "default",
                duration: 2000,
              });

              // Short delay to show the analysis toast first
              setTimeout(() => {
                generateRandomSuggestion();
              }, 2000);
            } else {
              // Just generate a random suggestion
              generateRandomSuggestion();
            }
          }}
        >
          <span className="material-icons mr-2">lightbulb</span>
          Get Learning Suggestion
        </Button>

        {/* Camera control button - uses global camera context */}
        <Button
          variant="default"
          size="lg"
          className={`${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg`}
          onClick={() => {
            if (isTracking) {
              globalStopTracking();
            } else {
              globalStartTracking();
            }
          }}
        >
          <span className="material-icons mr-2">{isTracking ? 'videocam_off' : 'videocam'}</span>
          {isTracking ? 'Disable Camera' : 'Enable Camera'}
        </Button>


      </div>

      {/* Video and canvas for tracking - always visible for debugging */}
      <div className="fixed bottom-2 right-2 w-72 border border-gray-500 rounded overflow-hidden z-[9999] shadow-lg bg-black">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-auto"
            width="640"
            height="480"
            autoPlay
            muted
            playsInline
            style={{ transform: 'scaleX(-1)' }} // Mirror the video
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            width="640"
            height="480"
            style={{ transform: 'scaleX(-1)' }} // Mirror the canvas to match video
          />
          {eyesClosed && timeRemaining !== null && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-500 text-white font-bold rounded text-center p-1">
              Eyes closed: {timeRemaining}s
            </div>
          )}
        </div>
        <div className="bg-black text-white p-2 text-xs">
          <p className="mb-1">{debugInfo}</p>

          {/* Confidence indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">Detection:</span>
            <span className={`text-xs ml-1 ${detectionConfidence > 0.8 ? 'text-green-500' : detectionConfidence > 0.6 ? 'text-yellow-500' : 'text-red-500'}`}>
              {(detectionConfidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">Threshold:</span>
            <span className="text-xs ml-1">{earThreshold.toFixed(3)}</span>
          </div>
          <Slider
            value={[earThreshold]}
            min={0.05}
            max={0.3}
            step={0.01}
            onValueChange={handleThresholdChange}
            className="mb-2"
          />

          {/* Test button for debugging */}
          <div className="flex gap-1 mb-2">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs py-0 h-6 flex-1"
              onClick={testEyesClosedNotification}
            >
              Test Eyes Closed
            </Button>
          </div>

          {/* Test mood survey button */}
          <div className="flex gap-1 mb-2">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs py-0 h-6 w-full"
              onClick={testMoodSurvey}
            >
              Test Mood Survey
            </Button>
          </div>

          {/* Reset all localStorage button */}
          <div className="flex gap-1 mb-2">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs py-0 h-6 w-full"
              onClick={() => {
                // Reset all relevant localStorage items
                try {
                  localStorage.removeItem('nxtwave_eyes_closed_notification_shown');
                  localStorage.removeItem('nxtwave_suggestion_shown');
                  localStorage.removeItem('nxtwave_facial_suggestion_shown');
                  localStorage.removeItem('nxtwave_last_suggestion_time');

                  // Reset the refs and state
                  eyesClosedNotificationShownRef.current = false;
                  setEyesClosedNotificationShown(false);

                  console.log('Reset ALL localStorage flags');
                  setDebugInfo('Reset ALL localStorage flags - everything can show again');

                  // Show confirmation
                  toast({
                    title: "Complete Reset Successful",
                    description: "All notification flags have been reset. Everything can show again.",
                    variant: "default",
                  });

                  // Force reload the page to ensure all state is reset
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } catch (error) {
                  console.error('Failed to reset localStorage:', error);
                }
              }}
            >
              RESET ALL & RELOAD
            </Button>
          </div>

          {/* Camera status indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">Camera Status:</span>
            <span className={`text-xs ml-1 ${isTracking ? 'text-green-500' : 'text-red-500'}`}>
              {isTracking ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Notification status */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs">Notifications:</span>
            <span className={`text-xs ml-1 ${shouldShowSuggestion() ? 'text-green-500' : 'text-yellow-500'}`}>
              {shouldShowSuggestion() ? "Ready" : "Cooldown"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="py-2 text-xs font-bold h-auto"
              variant={eyesClosed ? "destructive" : "default"}
              disabled={!isTracking}
            >
              {eyesClosed ? "EYES CLOSED" : "EYES OPEN"}
            </Button>

            <Button
              className="py-2 text-xs font-bold h-auto bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setShowMoodSurvey(true);
              }}
            >
              Mood Survey
            </Button>
          </div>







          {/* Calibration button */}
          {isTracking && historyBuffer.length >= 10 && !calibrated && (
            <Button
              className="w-full mt-2 py-1 text-xs font-bold h-auto"
              variant="secondary"
              onClick={calibrateEAR}
            >
              Calibrate Detection
            </Button>
          )}

          {/* Emotion data with visual indicators */}
          <div className="mt-2 border-t border-gray-700 pt-2">
            <div className="text-xs mb-1 font-bold">Emotion Analysis:</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>happy</span>
                <span>{(emotionState.happy * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>sad</span>
                <span>{(emotionState.sad * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>angry</span>
                <span>{(emotionState.angry * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>neutral</span>
                <span>{(emotionState.neutral * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>surprised</span>
                <span>{(emotionState.surprised * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>disgusted</span>
                <span>{(emotionState.disgusted * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facial Suggestion Component - uses global camera context */}
      <FacialSuggestion />

      {/* Mood Survey Dialog */}
      <Dialog
        open={showMoodSurvey}
        onOpenChange={(open) => {
          // Prevent the dialog from being closed by clicking outside
          // The user must submit the form to close it
          if (!open) {
            console.log("Attempted to close mood survey dialog without submitting");
            return false;
          }
          return true;
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
          console.log("Prevented closing mood survey by clicking outside");

          // Show a toast to inform the user they need to submit the form
          toast({
            title: "Please complete the survey",
            description: "You need to select a mood and submit the form to continue.",
            variant: "default",
          });
        }}>
          <DialogHeader>
            <DialogTitle>We noticed you may need a break</DialogTitle>
            <DialogDescription>
              Your eyes were closed for 3 seconds. Please take a moment to check in with how you're feeling.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <MoodTrackerInput onMoodSubmitted={handleMoodSubmitted} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EyeTracker;