import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause } from 'lucide-react';
import type { Meditation } from '@/services/MeditationService';
import MeditationService from '@/services/MeditationService';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';

interface MeditationPlayerProps {
  meditation: Meditation;
  onComplete?: () => void;
}

const MeditationPlayer: React.FC<MeditationPlayerProps> = ({ meditation, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const { updateMeditationProgress } = useData();
  const { toast } = useToast();
  
  // Timer for meditation progress
  useEffect(() => {
    let timer: number | null = null;
    
    if (isPlaying) {
      const startTime = Date.now();
      const duration = meditation.duration * 60 * 1000; // Convert minutes to milliseconds
      
      timer = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / duration) * 100;
        
        if (newProgress >= 100) {
          // Meditation complete
          setIsPlaying(false);
          setProgress(100);
          if (onComplete) {
            onComplete();
          }
          updateMeditationProgress(meditation.id, meditation.duration);
          toast({
            title: "Success",
            description: "Meditation completed!",
          });
          clearInterval(timer!);
        } else {
          setProgress(newProgress);
        }
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, meditation]);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        MeditationService.getInstance().stopCurrentMeditation();
        setIsPlaying(false);
      } else {
        await MeditationService.getInstance().playMeditation(meditation);
        setIsPlaying(true);
        setProgress(0);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play meditation audio",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      MeditationService.getInstance().stopCurrentMeditation();
    };
  }, []);

  const formatTime = (progress: number) => {
    const totalSeconds = Math.floor((meditation.duration * 60) * (progress / 100));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlayPause}
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{meditation.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatTime(progress)}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{formatTime(100)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeditationPlayer; 