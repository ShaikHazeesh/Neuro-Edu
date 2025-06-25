import React, { useState } from 'react';
import ReactPlayer from 'react-player';
// Import specific players to ensure they're bundled correctly
import 'react-player/youtube';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import YouTubeEmbed from '@/components/shared/YouTubeEmbed';

const TestVideoPage = () => {
  const [playing, setPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h');
  const [error, setError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  const handlePlayVideo = () => {
    setPlaying(true);
    setError(null);
  };

  const handleRetry = () => {
    setPlaying(false);
    setTimeout(() => setPlaying(true), 500);
    setError(null);
  };

  const handleError = (e: any) => {
    console.error('Video playback error:', e);
    setError('Failed to play the video. Try using the fallback player.');
  };

  const handleUseFallback = () => {
    setUseIframeFallback(true);
    setError(null);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Video Player Test</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          This page tests video playback functionality without relying on the API.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Video URL:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 p-2 border rounded-md"
              placeholder="Enter YouTube or direct video URL"
            />
            <Button onClick={handlePlayVideo}>Load Video</Button>
          </div>
        </div>

        <div className="bg-black rounded-lg overflow-hidden shadow-md relative aspect-video mb-6">
          {playing ? (
            <div className="absolute inset-0">
              {useIframeFallback ? (
                // Use the simple iframe-based YouTube embed as a fallback
                <YouTubeEmbed
                  videoId={videoUrl}
                  autoplay={true}
                />
              ) : (
                <>
                  {/* Fallback error UI that will show if ReactPlayer fails to render */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-0">
                    <AlertCircle className="h-12 w-12 mb-4 text-yellow-500" />
                    <h3 className="text-xl font-semibold mb-2">Loading Video...</h3>
                    <p className="text-center mb-4">If the video doesn't appear, please try the fallback player.</p>
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Retry
                      </Button>
                      <Button
                        onClick={handleUseFallback}
                        variant="secondary"
                      >
                        Use Fallback Player
                      </Button>
                    </div>
                  </div>

                  {/* The actual ReactPlayer with z-index to appear above the fallback */}
                  <div className="absolute inset-0 z-10">
                    <ReactPlayer
                      url={videoUrl}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={playing}
                      onError={handleError}
                      config={{
                        youtube: {
                          playerVars: {
                            origin: window.location.origin,
                            modestbranding: 1,
                            rel: 0
                          }
                        },
                        file: {
                          attributes: {
                            controlsList: 'nodownload',
                            disablePictureInPicture: true
                          }
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <Button
                onClick={handlePlayVideo}
                size="lg"
                className="bg-primary text-white hover:bg-primary/90"
              >
                Play Video
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUseFallback}
                  >
                    Use Fallback Player
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Make sure you have a stable internet connection</li>
            <li>Try using the provided YouTube URL (https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h)</li>
            <li>If using a direct video URL, ensure it's accessible and has the correct format</li>
            <li>Some videos may be restricted from embedding - try another video if needed</li>
            <li>Clear your browser cache and reload the page</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default TestVideoPage;
