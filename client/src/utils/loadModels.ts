import * as faceapi from 'face-api.js';

// Primary CDN URLs for face-api.js models (using HTTPS)
const PRIMARY_CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// CDN URLs for face-api.js models (using HTTPS)
const CDN_URLS = {
  tinyFaceDetector: PRIMARY_CDN,
  ssdMobilenetv1: PRIMARY_CDN,
  faceLandmark68Net: PRIMARY_CDN,
  faceExpressionNet: PRIMARY_CDN
};

// Local paths to try - Vite serves files from the public directory at the root path
const LOCAL_PATHS = [
  '/models',
  './models',
  '/face-models',
  './face-models',
  '../face-models'
];

// Additional CDN fallbacks
const ADDITIONAL_CDNS = [
  'https://unpkg.com/face-api.js/weights',
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
  'https://justadudewhohacks.github.io/face-api.js/weights'
];

// Direct model URLs for emergency fallback
const DIRECT_MODEL_URLS = {
  tinyFaceDetector: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json',
  ssdMobilenetv1: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/ssd_mobilenetv1_model-weights_manifest.json',
  faceLandmark68Net: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-weights_manifest.json',
  faceExpressionNet: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_expression_model-weights_manifest.json'
};

// Hardcoded model URLs for direct loading (last resort)
const HARDCODED_MODEL_URLS = {
  tinyFaceDetector: [
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-shard1',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/tiny_face_detector_model-weights_manifest.json'
  ],
  ssdMobilenetv1: [
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/ssd_mobilenetv1_model-shard1',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/ssd_mobilenetv1_model-shard2',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/ssd_mobilenetv1_model-weights_manifest.json'
  ],
  faceLandmark68Net: [
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-shard1',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_landmark_68_model-weights_manifest.json'
  ],
  faceExpressionNet: [
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_expression_model-shard1',
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/face_expression_model-weights_manifest.json'
  ]
};

// Direct model loading function (last resort)
export const loadModelDirectly = async (modelName: string): Promise<boolean> => {
  try {
    console.log(`Attempting to load ${modelName} directly from hardcoded URLs`);

    // List of CDNs to try in order
    const cdnsToTry = [
      'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model',
      'https://unpkg.com/face-api.js/weights',
      'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
    ];

    // For TinyFaceDetector
    if (modelName === 'tinyFaceDetector') {
      // Check if already loaded
      if (faceapi.nets.tinyFaceDetector.isLoaded) {
        console.log('TinyFaceDetector already loaded');
        return true;
      }

      // Try each CDN
      for (const cdn of cdnsToTry) {
        try {
          console.log(`Trying to load TinyFaceDetector from ${cdn}`);
          await faceapi.nets.tinyFaceDetector.loadFromUri(cdn);
          if (faceapi.nets.tinyFaceDetector.isLoaded) {
            console.log(`Successfully loaded TinyFaceDetector from ${cdn}`);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to load TinyFaceDetector from ${cdn}:`, err);
        }
      }

      return faceapi.nets.tinyFaceDetector.isLoaded;
    }

    // For SSD MobileNet
    if (modelName === 'ssdMobilenetv1') {
      // Check if already loaded
      if (faceapi.nets.ssdMobilenetv1.isLoaded) {
        console.log('SSD MobileNet already loaded');
        return true;
      }

      // Try each CDN
      for (const cdn of cdnsToTry) {
        try {
          console.log(`Trying to load SSD MobileNet from ${cdn}`);
          await faceapi.nets.ssdMobilenetv1.loadFromUri(cdn);
          if (faceapi.nets.ssdMobilenetv1.isLoaded) {
            console.log(`Successfully loaded SSD MobileNet from ${cdn}`);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to load SSD MobileNet from ${cdn}:`, err);
        }
      }

      return faceapi.nets.ssdMobilenetv1.isLoaded;
    }

    // For FaceLandmark68Net
    if (modelName === 'faceLandmark68Net') {
      // Check if already loaded
      if (faceapi.nets.faceLandmark68Net.isLoaded) {
        console.log('FaceLandmark68Net already loaded');
        return true;
      }

      // Try each CDN
      for (const cdn of cdnsToTry) {
        try {
          console.log(`Trying to load FaceLandmark68Net from ${cdn}`);
          await faceapi.nets.faceLandmark68Net.loadFromUri(cdn);
          if (faceapi.nets.faceLandmark68Net.isLoaded) {
            console.log(`Successfully loaded FaceLandmark68Net from ${cdn}`);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to load FaceLandmark68Net from ${cdn}:`, err);
        }
      }

      return faceapi.nets.faceLandmark68Net.isLoaded;
    }

    // For FaceExpressionNet
    if (modelName === 'faceExpressionNet') {
      // Check if already loaded
      if (faceapi.nets.faceExpressionNet.isLoaded) {
        console.log('FaceExpressionNet already loaded');
        return true;
      }

      // Try each CDN
      for (const cdn of cdnsToTry) {
        try {
          console.log(`Trying to load FaceExpressionNet from ${cdn}`);
          await faceapi.nets.faceExpressionNet.loadFromUri(cdn);
          if (faceapi.nets.faceExpressionNet.isLoaded) {
            console.log(`Successfully loaded FaceExpressionNet from ${cdn}`);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to load FaceExpressionNet from ${cdn}:`, err);
        }
      }

      return faceapi.nets.faceExpressionNet.isLoaded;
    }

    return false;
  } catch (error) {
    console.error(`Error loading ${modelName} directly:`, error);
    return false;
  }
};

// Load all necessary face-api.js models with improved reliability
export const loadFaceApiModels = async (modelsPath: string = import.meta.env.VITE_MODELS_PATH || '/models'): Promise<boolean> => {
  try {
    console.log('Loading face detection models from:', modelsPath);

    // Force reload models even if they claim to be loaded
    // This helps fix issues where models report as loaded but aren't working
    console.log('Attempting to load all face detection models');

    // Try to load models one by one with multiple fallbacks
    const loadModelWithFallback = async (
      modelName: string,
      loadFunction: (path: string) => Promise<void>
    ) => {
      // List of paths to try in order
      const pathsToTry = [
        modelsPath,                   // User-provided path
        ...LOCAL_PATHS,               // Local paths
        PRIMARY_CDN,                  // Primary CDN (most reliable)
        CDN_URLS[modelName as keyof typeof CDN_URLS], // Model-specific CDN
        ...ADDITIONAL_CDNS            // Additional CDNs
      ];

      // Try each path until one works
      for (const path of pathsToTry) {
        if (!path) continue; // Skip undefined paths

        try {
          console.log(`Attempting to load ${modelName} from: ${path}`);
          await loadFunction(path);
          console.log(`Successfully loaded ${modelName} from: ${path}`);
          return true;
        } catch (err) {
          console.warn(`Failed to load ${modelName} from ${path}:`, err);
          // Continue to next path
        }
      }

      // Last resort: Try loading directly from the manifest URL
      try {
        const directUrl = DIRECT_MODEL_URLS[modelName as keyof typeof DIRECT_MODEL_URLS];
        if (directUrl) {
          console.log(`Last resort: Attempting to load ${modelName} directly from manifest URL: ${directUrl}`);

          // For direct manifest loading, we need to use a different approach
          // Extract the base URL from the manifest URL
          const baseUrl = directUrl.substring(0, directUrl.lastIndexOf('/') + 1);

          // Use loadFromUri with the base URL
          await loadFunction(baseUrl);
          console.log(`Successfully loaded ${modelName} from direct URL: ${baseUrl}`);
          return true;
        }
      } catch (directErr) {
        console.error(`Failed to load ${modelName} from direct URL:`, directErr);
      }

      // Final resort: Try direct loading
      try {
        console.log(`Trying direct loading for ${modelName} as last resort`);
        const directLoaded = await loadModelDirectly(modelName);
        if (directLoaded) {
          console.log(`Successfully loaded ${modelName} using direct loading`);
          return true;
        }
      } catch (directLoadErr) {
        console.error(`Failed to load ${modelName} using direct loading:`, directLoadErr);
      }

      // If we get here, all paths failed
      console.error(`Failed to load ${modelName} from all paths`);
      return false;
    };

    // Track success of each model load
    const results = await Promise.all([
      loadModelWithFallback('tinyFaceDetector', (path) =>
        faceapi.nets.tinyFaceDetector.loadFromUri(path)
      ),

      loadModelWithFallback('faceLandmark68Net', (path) =>
        faceapi.nets.faceLandmark68Net.loadFromUri(path)
      ),

      loadModelWithFallback('faceExpressionNet', (path) =>
        faceapi.nets.faceExpressionNet.loadFromUri(path)
      )
    ]);

    // Optional: Load SSD MobileNet model (not required for basic functionality)
    try {
      await loadModelWithFallback('ssdMobilenetv1', (path) =>
        faceapi.nets.ssdMobilenetv1.loadFromUri(path)
      );
    } catch (ssdError) {
      console.warn('SSD MobileNet model failed to load, but it\'s optional:', ssdError);
      // Continue without SSD model
    }

    // Check if all required models loaded successfully
    const allModelsLoaded = results.every(result => result === true);

    if (allModelsLoaded) {
      console.log('All required face detection models loaded successfully!');
      return true;
    } else {
      console.warn('Some models failed to load, but we\'ll try to continue with what we have');
      // Return true if at least the basic models loaded
      return faceapi.nets.tinyFaceDetector.isLoaded && faceapi.nets.faceLandmark68Net.isLoaded;
    }
  } catch (error) {
    console.error('Error loading face detection models:', error);
    return false;
  }
};

// Get optimal detector options based on video dimensions
export const getOptimalDetectorOptions = (width: number, height: number): faceapi.TinyFaceDetectorOptions => {
  // Adjust input size based on video dimensions for optimal performance
  let inputSize = 320; // Default size

  // For smaller videos, use smaller input size
  if (width < 640 || height < 480) {
    inputSize = 224;
  }
  // For larger videos, use larger input size
  else if (width >= 1280 || height >= 720) {
    inputSize = 416;
  }

  // Lower the score threshold to make detection more sensitive
  // This will detect faces with lower confidence, which helps in challenging lighting conditions
  return new faceapi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold: 0.3 // Reduced from 0.5 to make detection more sensitive
  });
};

// Get SSD MobileNet options for more accurate detection
export const getSSDOptions = (): faceapi.SsdMobilenetv1Options => {
  return new faceapi.SsdMobilenetv1Options({
    minConfidence: 0.3, // Reduced from 0.5 to make detection more sensitive
    maxResults: 3 // Increased from 1 to detect multiple faces if present
  });
};

// Determine if SSD detector should be used based on performance and detection history
export const shouldUseSSDDetector = (
  devicePerformance: number,
  consecutiveDetections: number,
  consecutiveFailures: number
): boolean => {
  // If device performance is poor (< 0.4), use SSD for better accuracy
  if (devicePerformance < 0.4) {
    return true;
  }

  // If we're having trouble detecting faces, try SSD
  if (consecutiveFailures > 3 && consecutiveDetections < 5) {
    return true;
  }

  // Default to TinyFaceDetector for better performance
  return false;
};

// Helper to extract eye landmarks from face landmarks
export const getEyeLandmarks = (landmarks: faceapi.FaceLandmarks68): {
  leftEye: faceapi.Point[],
  rightEye: faceapi.Point[]
} => {
  // Get landmark positions
  const positions = landmarks.positions;

  // Left eye landmarks (points 36-41)
  const leftEye = positions.slice(36, 42);

  // Right eye landmarks (points 42-47)
  const rightEye = positions.slice(42, 48);

  return { leftEye, rightEye };
};

// Calculate a dynamic EAR threshold based on face proportions
export const calculateDynamicEARThreshold = (
  faceWidth: number,
  faceHeight: number,
  baseThreshold: number = 0.2
): number => {
  // Calculate face aspect ratio
  const faceRatio = faceHeight / faceWidth;

  // Adjust threshold based on face proportions
  // Wider faces may need slightly lower thresholds
  // Narrower faces may need slightly higher thresholds
  let adjustedThreshold = baseThreshold;

  if (faceRatio < 0.8) {
    // Wider face - lower threshold slightly
    adjustedThreshold = baseThreshold * 0.8;
  } else if (faceRatio > 1.2) {
    // Narrower face - raise threshold slightly
    adjustedThreshold = baseThreshold * 1.1;
  }

  // Ensure threshold stays in reasonable range
  return Math.max(0.1, Math.min(adjustedThreshold, 0.3));
};