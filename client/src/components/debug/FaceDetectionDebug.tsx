import React, { useState, useEffect } from 'react';
import { useCamera } from '@/context/camera-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as faceapi from 'face-api.js';

const FaceDetectionDebug: React.FC = () => {
  const { isModelLoaded, isTracking, startTracking, stopTracking, testCameraAccess } = useCamera();
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Check model status
  useEffect(() => {
    const checkModels = () => {
      const status = {
        tinyFaceDetector: faceapi.nets.tinyFaceDetector.isLoaded,
        ssdMobilenetv1: faceapi.nets.ssdMobilenetv1.isLoaded,
        faceLandmark68Net: faceapi.nets.faceLandmark68Net.isLoaded,
        faceExpressionNet: faceapi.nets.faceExpressionNet.isLoaded
      };
      setModelStatus(status);

      // Generate debug info
      const info = Object.entries(status)
        .map(([name, loaded]) => `${name}: ${loaded ? 'Loaded ✅' : 'Not Loaded ❌'}`)
        .join('\n');

      setDebugInfo(info);
    };

    checkModels();

    // Check again every 2 seconds
    const interval = setInterval(checkModels, 2000);

    return () => clearInterval(interval);
  }, [isModelLoaded]);

  // Force reload models
  const handleForceReload = async () => {
    try {
      setDebugInfo('Attempting to force reload models...');

      // Try to load from GitHub
      const result = await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceExpressionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');

      setDebugInfo('Models force reloaded successfully!');
    } catch (error) {
      setDebugInfo(`Error force reloading models: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Face Detection Debug
          <Badge variant={isModelLoaded ? "default" : "destructive"}>
            Models: {isModelLoaded ? 'Loaded' : 'Not Loaded'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test and debug face detection functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Model Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(modelStatus).map(([name, loaded]) => (
              <div key={name} className="flex items-center">
                <Badge variant={loaded ? "default" : "outline"} className="mr-2">
                  {loaded ? '✓' : '✗'}
                </Badge>
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Camera Status</h3>
          <Badge variant={isTracking ? "default" : "outline"}>
            {isTracking ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid gap-2">
          <h3 className="text-sm font-medium">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testCameraAccess} variant="outline" size="sm">
              Test Camera
            </Button>
            {isTracking ? (
              <Button onClick={stopTracking} variant="destructive" size="sm">
                Stop Camera
              </Button>
            ) : (
              <Button onClick={startTracking} variant="default" size="sm">
                Start Camera
              </Button>
            )}
            <Button onClick={handleForceReload} variant="outline" size="sm">
              Force Reload Models
            </Button>
            <Button
              onClick={() => window.open('/face-test.html', '_blank')}
              variant="outline"
              size="sm"
            >
              Open Test Page
            </Button>
            <Button
              onClick={() => window.open('/load-models.html', '_blank')}
              variant="outline"
              size="sm"
            >
              Load Models
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Debug Information</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-24 whitespace-pre-wrap">
            {debugInfo}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Troubleshooting face detection issues
        </p>
      </CardFooter>
    </Card>
  );
};

export default FaceDetectionDebug;
