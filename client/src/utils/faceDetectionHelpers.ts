import * as faceapi from 'face-api.js';

/**
 * Calculates the Euclidean distance between two points
 */
const euclideanDistance = (pt1: faceapi.Point, pt2: faceapi.Point): number => {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
};

/**
 * Calculates the Eye Aspect Ratio (EAR) for eye openness
 * Formula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * Where p1, p2, p3, p4, p5, p6 are the eye landmarks
 */
export const calculateEAR = (
  landmarks: faceapi.FaceLandmarks68,
  eyePoints: faceapi.Point[]
): number => {
  if (!eyePoints || eyePoints.length < 6) {
    return 0.3; // Default value if eye landmarks are missing
  }

  try {
    // Vertical distances (||p2-p6|| + ||p3-p5||)
    const verticalDist1 = euclideanDistance(eyePoints[1], eyePoints[5]);
    const verticalDist2 = euclideanDistance(eyePoints[2], eyePoints[4]);
    
    // Horizontal distance (||p1-p4||)
    const horizontalDist = euclideanDistance(eyePoints[0], eyePoints[3]);
    
    // Calculate EAR using the formula
    if (horizontalDist === 0) return 0.3; // Avoid division by zero
    
    const ear = (verticalDist1 + verticalDist2) / (2 * horizontalDist);
    
    // Validate EAR is within a reasonable range
    if (isNaN(ear) || ear > 1.0) {
      return 0.3; // Return a reasonable default
    }
    
    return ear;
  } catch (error) {
    console.error('Error calculating EAR:', error);
    return 0.3; // Return a reasonable default if calculation fails
  }
};

/**
 * Applies an exponential moving average to smooth the EAR values
 */
export const smoothEAR = (
  currentEAR: number,
  previousValues: number[],
  windowSize: number = 5,
  currentWeight: number = 0.4
): { smoothedValue: number; updatedValues: number[] } => {
  // Skip smoothing if current EAR is invalid
  if (isNaN(currentEAR) || currentEAR <= 0 || currentEAR > 1) {
    return {
      smoothedValue: previousValues.length > 0 ? previousValues[previousValues.length - 1] : 0.3,
      updatedValues: [...previousValues]
    };
  }
  
  // Add current value to history
  const updatedValues = [...previousValues, currentEAR];
  
  // Maintain window size
  if (updatedValues.length > windowSize) {
    updatedValues.shift();
  }
  
  // If we don't have enough values yet, just return the current value
  if (updatedValues.length < 3) {
    return { smoothedValue: currentEAR, updatedValues };
  }
  
  // Calculate weighted average with more weight to most recent values
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Apply exponential weighting (more recent values have higher weight)
  for (let i = 0; i < updatedValues.length; i++) {
    const weight = Math.pow(1 - currentWeight, updatedValues.length - i - 1);
    weightedSum += updatedValues[i] * weight;
    totalWeight += weight;
  }
  
  // Calculate final smoothed value
  const smoothedValue = weightedSum / totalWeight;
  
  return { smoothedValue, updatedValues };
};

/**
 * Draws eye landmarks on the canvas
 */
export const drawEyePoints = (
  context: CanvasRenderingContext2D,
  leftEye: faceapi.Point[],
  rightEye: faceapi.Point[]
): void => {
  // Draw left eye
  context.beginPath();
  context.strokeStyle = 'blue';
  context.lineWidth = 1;
  
  for (let i = 0; i < leftEye.length; i++) {
    const point = leftEye[i];
    if (i === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }
  
  // Close the left eye shape
  context.lineTo(leftEye[0].x, leftEye[0].y);
  context.stroke();
  
  // Draw right eye
  context.beginPath();
  context.strokeStyle = 'blue';
  
  for (let i = 0; i < rightEye.length; i++) {
    const point = rightEye[i];
    if (i === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }
  
  // Close the right eye shape
  context.lineTo(rightEye[0].x, rightEye[0].y);
  context.stroke();
  
  // Draw key points with different colors
  drawKeyPoints(context, leftEye, rightEye);
};

/**
 * Draws key eye points used in EAR calculation
 */
const drawKeyPoints = (
  context: CanvasRenderingContext2D,
  leftEye: faceapi.Point[],
  rightEye: faceapi.Point[]
): void => {
  const keyPoints = [
    // Left eye horizontal points
    { point: leftEye[0], color: 'red' },   // p1
    { point: leftEye[3], color: 'red' },   // p4
    
    // Left eye vertical points
    { point: leftEye[1], color: 'green' }, // p2
    { point: leftEye[5], color: 'green' }, // p6
    { point: leftEye[2], color: 'yellow' }, // p3
    { point: leftEye[4], color: 'yellow' }, // p5
    
    // Right eye horizontal points
    { point: rightEye[0], color: 'red' },   // p1
    { point: rightEye[3], color: 'red' },   // p4
    
    // Right eye vertical points
    { point: rightEye[1], color: 'green' }, // p2
    { point: rightEye[5], color: 'green' }, // p6
    { point: rightEye[2], color: 'yellow' }, // p3
    { point: rightEye[4], color: 'yellow' }, // p5
  ];
  
  keyPoints.forEach(({ point, color }) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
    context.fill();
  });
}; 