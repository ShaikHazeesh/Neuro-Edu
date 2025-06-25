import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Video, Gamepad2, Heart, ArrowRight, BarChart } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const { videos, games, meditations, stats, progress } = useData();
  
  // Calculate progress percentages
  const videosWatched = progress.filter(p => p.userId === user?.id).length;
  const videosCompleted = progress.filter(p => p.userId === user?.id && p.completed).length;
  const videoProgress = videos.length > 0 ? (videosWatched / videos.length) * 100 : 0;
  
  // Recent videos
  const recentVideos = videos.slice(0, 3);

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Main content */}
        <div className="flex-1">
          {/* Welcome section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-wellness-light-blue/30 to-transparent z-0"></div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
                <p className="text-gray-600 max-w-xl">
                  Continue your wellness journey with educational videos, relaxing games,
                  and guided meditations designed to support your mental wellbeing.
                </p>
                
                <div className="mt-6">
                  <Button 
                    className="bg-wellness-blue hover:bg-wellness-blue/90"
                    size="lg"
                    asChild
                  >
                    <Link to="/videos">
                      Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Quick access sections */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-wellness-blue">
                    <Video className="mr-2 h-5 w-5" />
                    Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Watch educational videos about mental wellness and coping strategies.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/videos">Browse Videos</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-wellness-sage">
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    Games
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Relax and unwind with games designed to reduce stress and improve focus.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/games">Play Games</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-rose-400">
                    <Heart className="mr-2 h-5 w-5" />
                    Meditations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Practice mindfulness with guided meditations for mental wellbeing.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/meditations">Start Meditating</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
          
          {/* Recent videos */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Continue Learning</h2>
              <Link to="/videos" className="text-wellness-blue hover:text-wellness-blue/80 flex items-center">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentVideos.map(video => (
                <Card key={video.id} className="hover-scale overflow-hidden">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{video.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild className="w-full bg-wellness-blue hover:bg-wellness-blue/90">
                      <Link to={`/videos/${video.id}`}>Watch Now</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
        
        {/* Sidebar with progress stats */}
        <div className="w-full md:w-80 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Videos Watched</span>
                  <span className="text-sm font-medium">{videosWatched}/{videos.length}</span>
                </div>
                <Progress value={videoProgress} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Videos Completed</span>
                  <span className="text-sm font-medium">{videosCompleted}/{videos.length}</span>
                </div>
                <Progress value={(videosCompleted / videos.length) * 100} className="h-2" />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Activity Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Watch Time</span>
                    <span className="text-sm font-medium">
                      {stats ? Math.floor(stats.totalWatchTime / 60) : 0} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Games Played</span>
                    <span className="text-sm font-medium">
                      {stats?.gamesPlayed || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Meditations Completed</span>
                    <span className="text-sm font-medium">
                      {stats?.meditationsCompleted || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/profile">View Full Profile</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
