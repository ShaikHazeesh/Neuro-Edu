
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, PlayCircle } from 'lucide-react';

const Videos = () => {
  const { videos, getVideoProgress } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Extract unique categories from videos
  const categories = ['all', ...Array.from(new Set(videos.map(video => video.category)))];
  
  // Filter videos by search query and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || video.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Calculate video progress
  const getProgressPercentage = (videoId: string) => {
    const videoProgress = getVideoProgress(videoId);
    if (!videoProgress) return 0;
    
    const video = videos.find(v => v.id === videoId);
    if (!video || !video.duration) return 0;
    
    return Math.min(100, (videoProgress.progress / video.duration) * 100);
  };
  
  // Check if video is completed
  const isVideoCompleted = (videoId: string) => {
    const videoProgress = getVideoProgress(videoId);
    return videoProgress?.completed || false;
  };
  
  return (
    <div className="container mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Educational Videos</h1>
        <p className="text-gray-600 max-w-2xl">
          Watch videos about mental health, wellness strategies, and coping mechanisms.
          Set a learning timer to manage your screen time.
        </p>
      </header>
      
      {/* Search and filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto overflow-auto no-scrollbar">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.length > 0 ? (
          filteredVideos.map(video => (
            <Card key={video.id} className="hover-scale overflow-hidden flex flex-col">
              <div className="aspect-video relative overflow-hidden group">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-white" />
                </div>
                
                {isVideoCompleted(video.id) && (
                  <div className="absolute top-2 right-2 bg-wellness-sage text-white text-xs px-2 py-1 rounded-full">
                    Completed
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0">
                  <Progress value={getProgressPercentage(video.id)} className="h-1 rounded-none" />
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                <CardDescription className="line-clamp-2">{video.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">{Math.floor(video.duration / 60)} minutes</span>
                  <span className="text-xs bg-wellness-light-blue/30 text-wellness-blue px-2 py-0.5 rounded-full">
                    {video.category}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button asChild className="w-full bg-wellness-blue hover:bg-wellness-blue/90">
                  <Link to={`/videos/${video.id}`}>
                    {getProgressPercentage(video.id) > 0 && !isVideoCompleted(video.id) 
                      ? 'Continue Watching' 
                      : 'Watch Now'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">No videos found matching your search.</p>
            <Button 
              variant="outline" 
              onClick={() => {setSearchQuery(''); setActiveCategory('all');}}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;
