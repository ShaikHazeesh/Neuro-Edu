
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import VideoPlayer from '@/components/videos/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, List, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const VideoDetail = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { videos } = useData();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(videos.find(v => v.id === videoId));
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState(videos.filter(v => v.id !== videoId).slice(0, 3));
  
  // Simulate loading of video data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle video not found
  useEffect(() => {
    if (!loading && !video) {
      navigate('/videos', { replace: true });
    }
  }, [video, loading, navigate]);
  
  // Handle video completion
  const handleVideoComplete = () => {
    // This could show a completion message or prompt for the next step
    // For now, we'll just navigate to games after a delay
    setTimeout(() => {
      navigate('/games');
    }, 3000);
  };
  
  if (loading || !video) {
    return (
      <div className="container mx-auto py-6 animate-fade-in">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Videos
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            {/* Video player skeleton */}
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-4/5 mb-1" />
          </div>
          
          <div className="md:w-80 shrink-0">
            <Skeleton className="h-8 w-40 mb-4" />
            <Skeleton className="h-24 w-full mb-3" />
            <Skeleton className="h-24 w-full mb-3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 animate-fade-in">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Videos
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          {/* Video player */}
          <VideoPlayer video={video} onComplete={handleVideoComplete} />
          
          {/* Video metadata */}
          <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-lg p-6 border border-wellness-light-blue/20">
            <h2 className="text-xl font-semibold mb-1">About this Video</h2>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(video.duration / 60)} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1">
                <List className="h-4 w-4" />
                <span>{video.category}</span>
              </div>
            </div>
            
            <p className="text-gray-700">{video.description}</p>
          </div>
        </div>
        
        {/* Sidebar with related videos */}
        <div className="md:w-80 shrink-0">
          <h3 className="font-semibold text-lg mb-4">Related Videos</h3>
          
          <div className="space-y-4">
            {relatedVideos.map(relatedVideo => (
              <Card key={relatedVideo.id} className="overflow-hidden hover-scale">
                <Link to={`/videos/${relatedVideo.id}`} className="flex flex-col">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={relatedVideo.thumbnail} 
                      alt={relatedVideo.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base line-clamp-2">{relatedVideo.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="py-0 pb-3 px-4">
                    <p className="text-xs text-gray-500">
                      {Math.floor(relatedVideo.duration / 60)} minutes · {relatedVideo.category}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
