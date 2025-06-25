
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronRight, Award, Clock, BookOpen } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { getWatchedVideos, completedMeditations, completedGames } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const watchedVideos = getWatchedVideos();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send data to the backend
    toast.success("Profile updated successfully");
    setIsEditing(false);
  };
  
  // Calculate user statistics
  const totalVideosWatched = watchedVideos.length;
  const totalMinutesLearned = watchedVideos.reduce((acc, video) => acc + (video.duration || 0), 0) / 60;
  const completionRate = watchedVideos.filter(v => v.completed).length / (watchedVideos.length || 1) * 100;
  
  if (!user) return <div>Loading...</div>;
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${user.id}`} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <div className="mt-1">
                  <Badge variant="outline" className="bg-wellness-light-blue/20 text-wellness-blue">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Member Since</div>
                    <div className="text-sm">{new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Last Login</div>
                    <div className="text-sm">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              {isEditing && (
                <Button onClick={handleSubmit}>Save Changes</Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Videos Watched</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <BookOpen className="mr-2 h-4 w-4 text-wellness-blue" />
                  {totalVideosWatched}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minutes Learned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-wellness-sage" />
                  {totalMinutesLearned.toFixed(0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Award className="mr-2 h-4 w-4 text-amber-500" />
                  {completionRate.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recently Watched</CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              {watchedVideos.length > 0 ? (
                <div className="space-y-2">
                  {watchedVideos.slice(0, 5).map((video, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-wellness-light-blue/30 flex items-center justify-center mr-3">
                          <BookOpen className="h-5 w-5 text-wellness-blue" />
                        </div>
                        <div>
                          <div className="font-medium">{video.title}</div>
                          <div className="text-sm text-gray-500">
                            {video.completed ? 'Completed' : `${Math.round(video.progress / video.duration * 100)}% complete`}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = `/videos/${video.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  You haven't watched any videos yet.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/videos'}>
                View All Learning Content
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive emails about your account activity</div>
                </div>
                <div>
                  <Button variant="outline" onClick={() => toast.success("Email preference updated")}>
                    {true ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Auto-play Videos</div>
                  <div className="text-sm text-gray-500">Automatically play the next video in a series</div>
                </div>
                <div>
                  <Button variant="outline" onClick={() => toast.success("Auto-play preference updated")}>
                    {false ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
