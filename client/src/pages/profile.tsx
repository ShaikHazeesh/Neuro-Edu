import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, User, BookOpen, Award, SmilePlus, BrainCircuit, Flame } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  avatarUrl: z.string().optional(),
});

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user progress stats
  const { data: userProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: ['/api/user/progress'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Fetch user's mood entries
  const { data: moodEntries, isLoading: isMoodLoading } = useQuery({
    queryKey: ['/api/mood'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Calculate mood statistics
  const moodStats = useMemo(() => {
    if (!moodEntries || moodEntries.length === 0) {
      return { Good: 0, Okay: 0, Struggling: 0 };
    }
    
    return moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [moodEntries]);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-10 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - user info */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-col items-center pb-2">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                  <AvatarFallback className="text-xl">{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-center">{user.fullName || user.username}</CardTitle>
                <CardDescription className="text-center">Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6 mt-6">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm">{user.username}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm">Courses: {isProgressLoading ? "Loading..." : userProgress?.stats?.courseCount || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm">Completed Lessons: {isProgressLoading ? "Loading..." : userProgress?.stats?.totalLessons || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Flame className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm">Current Streak: {isProgressLoading ? "Loading..." : userProgress?.stats?.streak || 0} days</span>
                  </div>
                  <div className="flex items-center">
                    <SmilePlus className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm">Mood Entries: {isMoodLoading ? "Loading..." : moodEntries?.length || 0}</span>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Course Progress</h3>
                  {isProgressLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : userProgress?.courses?.length > 0 ? (
                    <div className="space-y-4">
                      {userProgress.courses.map((course) => (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{course.title}</span>
                            <span>{Math.round(course.progress * 100)}%</span>
                          </div>
                          <Progress value={course.progress * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No courses started yet. Explore our course catalog!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column */}
          <div className="md:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="progress">Learning Stats</TabsTrigger>
                <TabsTrigger value="wellbeing">Wellbeing</TabsTrigger>
              </TabsList>
              
              {/* Profile tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your profile details here. Your profile helps us personalize your learning experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormDescription>
                                This is the name that will be displayed on your profile
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                We'll use this email for important notifications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="avatarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Avatar URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com/avatar.jpg" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormDescription>
                                Link to an online image for your profile avatar
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Progress tab */}
              <TabsContent value="progress">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                    <CardDescription>
                      Track your progress across all learning modules and quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isProgressLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl flex items-center">
                                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                                Courses
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{userProgress?.stats?.courseCount || 0}</p>
                              <p className="text-sm text-muted-foreground">Total courses enrolled</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl flex items-center">
                                <Award className="h-5 w-5 mr-2 text-primary" />
                                Lessons
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{userProgress?.stats?.totalLessons || 0}</p>
                              <p className="text-sm text-muted-foreground">Lessons completed</p>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl flex items-center">
                                <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
                                Quizzes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{userProgress?.stats?.quizzesPassed || 0}</p>
                              <p className="text-sm text-muted-foreground">Quizzes passed</p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                          {userProgress?.recentActivity && userProgress.recentActivity.length > 0 ? (
                            <div className="space-y-4">
                              {userProgress.recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-start border-b pb-4 last:border-0">
                                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                                    {activity.type === 'lesson' ? (
                                      <BookOpen className="h-5 w-5 text-primary" />
                                    ) : (
                                      <BrainCircuit className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{activity.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {activity.type === 'lesson' ? 'Completed lesson' : 'Passed quiz'} • {new Date(activity.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No recent activity. Start learning to see your progress!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Wellbeing tab */}
              <TabsContent value="wellbeing">
                <Card>
                  <CardHeader>
                    <CardTitle>Wellbeing Insights</CardTitle>
                    <CardDescription>
                      Track your mental health journey and access wellbeing resources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isMoodLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-green-50 dark:bg-green-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl">Good Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{moodStats.Good || 0}</p>
                              <p className="text-sm opacity-80">Tracked mood entries</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-blue-50 dark:bg-blue-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl">Okay Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{moodStats.Okay || 0}</p>
                              <p className="text-sm opacity-80">Tracked mood entries</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-orange-50 dark:bg-orange-900/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xl">Struggling Days</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-3xl font-bold">{moodStats.Struggling || 0}</p>
                              <p className="text-sm opacity-80">Tracked mood entries</p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Recent Mood Entries</h3>
                          {moodEntries && moodEntries.length > 0 ? (
                            <div className="space-y-4">
                              {moodEntries.slice(0, 5).map((entry) => (
                                <div key={entry.id} className="flex items-start border-b pb-4 last:border-0">
                                  <div className={`p-2 rounded-full mr-4 ${
                                    entry.mood === 'Good' ? 'bg-green-100 dark:bg-green-900/30' : 
                                    entry.mood === 'Okay' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                                    'bg-orange-100 dark:bg-orange-900/30'
                                  }`}>
                                    <SmilePlus className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <p className="font-medium">{entry.mood}</p>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        {new Date(entry.createdAt || Date.now()).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {entry.journal && (
                                      <p className="text-sm mt-1">{entry.journal}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No mood entries yet. Start tracking to see insights!</p>
                          )}
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Wellbeing Resources</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button variant="outline" className="justify-start h-auto py-4">
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">Breathing Exercises</span>
                                <span className="text-sm text-muted-foreground">Reduce stress with guided breathing</span>
                              </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-4">
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">Mindfulness Techniques</span>
                                <span className="text-sm text-muted-foreground">Stay present and focused</span>
                              </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-4">
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">Study Break Tips</span>
                                <span className="text-sm text-muted-foreground">Optimize your study sessions</span>
                              </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-4">
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">Talk to AI Assistant</span>
                                <span className="text-sm text-muted-foreground">Get mental health support</span>
                              </div>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;