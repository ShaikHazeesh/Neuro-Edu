import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, Video } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from "sonner";
import { Clock } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onComplete }) => {
  const { updateVideoProgress, getVideoProgress } = useData();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [showTimerDialog, setShowTimerDialog] = useState(false);
  const [selectedTime, setSelectedTime] = useState(5); // Default 5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Video progress from context
  const savedProgress = getVideoProgress(video.id);
  
  // Refs
  const playerRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to extract video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  // Initialize player with saved progress
  useEffect(() => {
    const videoId = getYouTubeVideoId(video.url);
    if (!videoId) {
      console.error('Invalid YouTube URL:', video.url);
      setLoading(false);
      toast.error('Invalid YouTube video URL');
      return;
    }

    // Create the YouTube player iframe with native controls
    if (playerRef.current) {
      const startTime = savedProgress ? Math.floor(savedProgress.progress) : 0;
      playerRef.current.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=1&controls=1&modestbranding=1&rel=0&start=${startTime}&fs=1`;
      
      // Show resume message if there's saved progress
      if (savedProgress && savedProgress.progress > 0) {
        toast.info(`Resuming from ${formatTime(savedProgress.progress)}`);
      }
    }

    // Set up message listener for YouTube iframe API
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange") {
          switch (data.info) {
            case 1: // playing
              setLoading(false);
              break;
            case 0: // ended
              saveProgress(video.duration, true);
              if (onComplete) onComplete();
              break;
            case 3: // buffering
              setLoading(true);
              break;
          }
        } else if (data.event === "onReady") {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error handling YouTube message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [video.url, savedProgress]);

  // Timer countdown effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  // Save video progress
  const saveProgress = useCallback(async (time: number, completed: boolean) => {
    try {
      await updateVideoProgress(video.id, time, completed);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [video.id, updateVideoProgress]);

  const handleTimerStart = () => {
    setTimerActive(true);
    setTimeRemaining(selectedTime * 60);
    setShowTimerDialog(false);
    toast.success(`Timer set for ${selectedTime} minute${selectedTime !== 1 ? 's' : ''}`);
  };

  const handleTimerComplete = () => {
    setTimerActive(false);
    saveProgress(video.duration, true);
    toast.success("Learning session complete! Moving to games section...");
    setTimeout(() => {
      navigate('/games');
    }, 1500);
  };

  // Helper function to format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden bg-black rounded-lg">
        {/* Video container */}
        <div className="relative aspect-video bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="animate-pulse text-white">Loading video...</div>
            </div>
          )}
          <iframe
            ref={playerRef}
            className="absolute top-0 left-0 w-full h-full"
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          ></iframe>
          
          {/* Timer indicator */}
          {timerActive && (
            <div className="absolute top-4 right-4 bg-black/70 text-white rounded-full px-3 py-1 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        {/* Timer button */}
        <div className="bg-white p-4 border-t flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimerDialog(true)}
            className="text-gray-700 hover:text-wellness-blue hover:bg-wellness-light-blue/20"
          >
            <Clock className="h-4 w-4 mr-2" />
            Set Learning Timer
          </Button>
        </div>
      </Card>
      
      {/* Timer selection dialog */}
      <Dialog open={showTimerDialog} onOpenChange={setShowTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Learning Timer</DialogTitle>
            <DialogDescription>
              How long would you like to learn today? After the timer ends, you'll be directed to the relaxation games.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-3 py-4">
            {[5, 10, 15, 20, 30, 45].map(minutes => (
              <Button
                key={minutes}
                variant={selectedTime === minutes ? "default" : "outline"}
                className={selectedTime === minutes ? "bg-wellness-blue" : ""}
                onClick={() => setSelectedTime(minutes)}
              >
                {minutes} min
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimerStart} className="bg-wellness-blue hover:bg-wellness-blue/90">
              Start Timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoPlayer;
