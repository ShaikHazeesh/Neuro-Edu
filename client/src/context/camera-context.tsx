import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceApiModels } from '@/utils/loadModels';
import { useToast } from '@/hooks/use-toast';

interface CameraContextType {
  isTracking: boolean;
  isModelLoaded: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  emotionState: EmotionState;
  setEmotionState: (state: EmotionState) => void;
  testCameraAccess: () => Promise<boolean>;
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

const defaultEmotionState: EmotionState = {
  happy: 0,
  sad: 0,
  angry: 0,
  neutral: 0,
  surprised: 0,
  fearful: 0,
  disgusted: 0
};

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [emotionState, setEmotionState] = useState<EmotionState>(defaultEmotionState);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Load models on initial mount
  useEffect(() => {
    const initModels = async () => {
      try {
        console.log('Loading face detection models...');

        // Show a toast to indicate we're loading models
        toast({
          title: "Loading Models",
          description: "Initializing face detection models. This may take a moment...",
          variant: "default",
          duration: 3000,
        });

        // Try to load models with multiple attempts and different paths
        let loaded = false;
        let attempts = 0;
        const maxAttempts = 5;

        // Different paths to try in order - these match the paths in loadModels.ts
        const pathsToTry = [
          '/models',
          './models',
          '/public/models',
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
          'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
          'https://unpkg.com/face-api.js/weights'
        ];

        // First try with the default path
        console.log('First attempt with default paths');
        try {
          loaded = await loadFaceApiModels();
          if (loaded) {
            console.log('Successfully loaded models with default paths');
          }
        } catch (error) {
          console.error('Error loading models with default paths:', error);
        }

        // If that failed, try specific paths
        while (!loaded && attempts < maxAttempts) {
          const currentPath = pathsToTry[attempts % pathsToTry.length];
          attempts++;
          console.log(`Attempt ${attempts} to load face detection models from ${currentPath}`);

          try {
            loaded = await loadFaceApiModels(currentPath);
            if (loaded) {
              console.log(`Successfully loaded models from ${currentPath}`);
            }
          } catch (loadError) {
            console.error(`Error in load attempt ${attempts} from ${currentPath}:`, loadError);
          }

          // Wait a bit before trying again
          if (!loaded && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Last resort: Try loading directly from CDN
        if (!loaded) {
          console.log('All attempts failed, trying direct CDN loading as last resort');
          try {
            // Import the loadModelDirectly function
            const { loadModelDirectly } = await import('@/utils/loadModels');

            // Try to load each model directly
            const tinyFaceLoaded = await loadModelDirectly('tinyFaceDetector');
            const landmarkLoaded = await loadModelDirectly('faceLandmark68Net');
            const expressionLoaded = await loadModelDirectly('faceExpressionNet');

            // Check if models are loaded
            loaded = tinyFaceLoaded && landmarkLoaded && expressionLoaded;

            console.log('Direct loading results:', {
              tinyFaceLoaded,
              landmarkLoaded,
              expressionLoaded,
              overall: loaded
            });

            // If that failed, try one more time with direct URI loading
            if (!loaded) {
              console.log('Direct loading failed, trying one more time with hardcoded URIs');

              // Force load each model individually from CDN
              await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
              await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');
              await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model');

              // Check if models are loaded
              loaded = faceapi.nets.tinyFaceDetector.isLoaded &&
                      faceapi.nets.faceLandmark68Net.isLoaded &&
                      faceapi.nets.faceExpressionNet.isLoaded;

              console.log('Final direct CDN loading result:', loaded);
            }
          } catch (directError) {
            console.error('Error in direct CDN loading:', directError);
          }
        }

        if (loaded) {
          setIsModelLoaded(true);
          console.log('Face detection models loaded successfully!');

          // Show success toast
          toast({
            title: "Models Loaded",
            description: "Face detection models loaded successfully!",
            variant: "default",
            duration: 3000,
          });

          // Check if camera was previously active
          const wasCameraActive = localStorage.getItem('nxtwave_camera_active') === 'true';

          if (wasCameraActive) {
            console.log('Camera was previously active, attempting to start tracking');
            // Add a slight delay to ensure models are fully initialized
            setTimeout(() => {
              startTracking();
            }, 1000);
          }
        } else {
          console.error('Failed to load face detection models after multiple attempts');

          // Show error toast
          toast({
            title: "Model Loading Failed",
            description: "Could not load face detection models. Some features may not work correctly.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Error initializing face models:', error);

        // Show error toast
        toast({
          title: "Model Loading Error",
          description: "An error occurred while loading face detection models.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    initModels();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        stopTracking();
      }
    };
  }, []);

  // Start webcam and face tracking
  const startTracking = async () => {
    // Clear any previous streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Make sure video element exists
    if (!videoRef.current) {
      console.error('Video element not available');
      return;
    }

    try {
      console.log('Requesting camera access...');

      // Try with different constraints if needed
      let stream;

      try {
        // First try with high quality
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          },
          audio: false // Explicitly disable audio
        });
        console.log('Got high quality camera stream');
      } catch (highQualityError) {
        console.warn('Failed to get high quality stream, trying with basic constraints', highQualityError);

        try {
          // If that fails, try with basic constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false // Explicitly disable audio
          });
          console.log('Got basic camera stream');
        } catch (basicError) {
          console.error('Failed to get basic camera stream', basicError);

          // Try one more time with minimal constraints
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 15 }
              },
              audio: false
            });
            console.log('Got minimal camera stream');
          } catch (minimalError) {
            console.error('All camera access attempts failed', minimalError);
            throw new Error('Could not access camera after multiple attempts');
          }
        }
      }

      // Store the stream reference
      streamRef.current = stream;

      // Make sure video element exists before setting srcObject
      if (videoRef.current) {
        // Clear any existing srcObject
        if (videoRef.current.srcObject) {
          try {
            const oldStream = videoRef.current.srcObject as MediaStream;
            oldStream.getTracks().forEach(track => track.stop());
          } catch (err) {
            console.error('Error stopping old stream:', err);
          }
          videoRef.current.srcObject = null;
        }

        // Set new stream
        videoRef.current.srcObject = stream;

        // Force video element to be visible
        videoRef.current.style.display = 'block';

        // Set up event handlers
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            console.log('Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

            // Ensure video is playing
            videoRef.current.play()
              .then(() => {
                console.log('Video playback started successfully');
                setIsTracking(true);

                // Store camera status in localStorage
                try {
                  localStorage.setItem('nxtwave_camera_active', 'true');
                } catch (error) {
                  console.error('Failed to save camera status:', error);
                }

                // Show success toast
                toast({
                  title: "Camera Active",
                  description: "Camera is now active and tracking is enabled.",
                  variant: "default",
                  duration: 3000,
                });
              })
              .catch(playError => {
                console.error('Error playing video:', playError);

                // Try to recover by recreating the video element
                try {
                  // Create a new video element
                  const newVideo = document.createElement('video');
                  newVideo.width = 640;
                  newVideo.height = 480;
                  newVideo.autoplay = true;
                  newVideo.muted = true;
                  newVideo.playsInline = true;

                  // Replace the old video element
                  if (videoRef.current && videoRef.current.parentNode) {
                    videoRef.current.parentNode.replaceChild(newVideo, videoRef.current);
                    videoRef.current = newVideo;

                    // Try again with the new video element
                    videoRef.current.srcObject = stream;
                    videoRef.current.play()
                      .then(() => {
                        console.log('Video playback started with new element');
                        setIsTracking(true);
                      })
                      .catch(err => {
                        console.error('Still failed to play video:', err);
                        throw err;
                      });
                  }
                } catch (recoveryError) {
                  console.error('Failed to recover from video play error:', recoveryError);
                  throw playError;
                }
              });
          }
        };

        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
        };

        videoRef.current.onerror = (err) => {
          console.error('Video element error:', err);
        };
      } else {
        throw new Error('Video element not available after creation attempt');
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);

      // Store camera status in localStorage
      try {
        localStorage.setItem('nxtwave_camera_active', 'false');
      } catch (storageError) {
        console.error('Failed to save camera status:', storageError);
      }

      // Show a toast notification about camera access
      toast({
        title: "Camera Access Failed",
        description: "Could not access your camera. Please check your browser permissions and try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Stop tracking
  const stopTracking = () => {
    console.log('Stopping tracking and cleaning up resources');

    // Stop all tracks in the stream
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        console.log(`Stopping ${tracks.length} media tracks`);
        tracks.forEach((track) => {
          try {
            track.stop();
            console.log(`Stopped track: ${track.kind}`);
          } catch (trackError) {
            console.error('Error stopping track:', trackError);
          }
        });
        streamRef.current = null;
      } catch (streamError) {
        console.error('Error stopping stream:', streamError);
      }
    }

    // Clear video source if video element exists
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current.srcObject = null;
        console.log('Cleared video source');
      } catch (videoError) {
        console.error('Error clearing video source:', videoError);
      }
    }

    // Update state
    setIsTracking(false);

    // Update localStorage
    try {
      localStorage.setItem('nxtwave_camera_active', 'false');
    } catch (error) {
      console.error('Failed to update camera status in localStorage:', error);
    }

    // Show toast notification
    toast({
      title: "Camera Stopped",
      description: "Eye tracking has been stopped. You can enable it again using the camera button.",
      variant: "default",
      duration: 3000,
    });
  };

  // Update emotion state
  const updateEmotionState = (newState: EmotionState) => {
    setEmotionState(newState);
  };

  // Test camera access directly
  const testCameraAccess = async (): Promise<boolean> => {
    try {
      console.log('Testing direct camera access...');

      // Try to get a basic camera stream
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      // If we get here, we have camera access
      console.log('Camera test successful, stopping test stream');

      // Stop the test stream
      testStream.getTracks().forEach(track => track.stop());

      // Show success toast
      toast({
        title: "Camera Test Successful",
        description: "Your camera is accessible. You can now enable tracking.",
        variant: "default",
        duration: 3000,
      });

      return true;
    } catch (error) {
      console.error('Camera test failed:', error);

      // Show error toast
      toast({
        title: "Camera Test Failed",
        description: "Could not access your camera. Please check your browser permissions.",
        variant: "destructive",
        duration: 5000,
      });

      return false;
    }
  };

  const value = {
    isTracking,
    isModelLoaded,
    videoRef,
    canvasRef,
    streamRef,
    startTracking,
    stopTracking,
    emotionState,
    setEmotionState,
    testCameraAccess
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = (): CameraContextType => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
};
