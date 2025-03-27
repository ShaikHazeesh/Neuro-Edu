import { useState } from "react";
import { motion } from "framer-motion";
import ReactPlayer from "react-player/lazy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const VideoSection = () => {
  const [playing, setPlaying] = useState(false);
  const [activeModule, setActiveModule] = useState(1);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: videoLesson, isLoading } = useQuery({
    queryKey: ['/api/lessons/featured'],
  });
  
  // Mutation to mark lesson as completed
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await apiRequest("POST", `/api/lessons/${lessonId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      setLessonCompleted(true);
      toast({
        title: "Lesson Completed!",
        description: "Your progress has been updated.",
        variant: "default",
      });
      // Invalidate queries to refresh user progress data
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    },
    onError: (error) => {
      console.error("Error marking lesson as completed:", error);
      toast({
        title: "Error",
        description: "Failed to update lesson progress. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleMarkAsCompleted = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to track your progress.",
        variant: "destructive",
      });
      return;
    }
    
    if (videoLesson?.id) {
      completeLessonMutation.mutate(videoLesson.id);
    }
  };
  
  const handlePlayVideo = () => {
    setPlaying(true);
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <motion.div 
              className="bg-black rounded-standard overflow-hidden shadow-md relative aspect-video"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <>
                  {playing ? (
                    <ReactPlayer
                      url={videoLesson?.videoUrl || ""}
                      width="100%"
                      height="100%"
                      controls
                      playing={playing}
                      className="absolute top-0 left-0"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img 
                        src={videoLesson?.thumbnailUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"} 
                        alt="Course video thumbnail" 
                        className="w-full h-full object-cover opacity-70" 
                      />
                      <button 
                        onClick={handlePlayVideo} 
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="Play video"
                      >
                        <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center pl-1 transition-transform hover:scale-110">
                          <span className="material-icons text-primary text-3xl">play_arrow</span>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
            
            <div className="mt-6">
              {isLoading ? (
                <div>
                  <Skeleton className="h-7 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-full mb-4" />
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40 mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-outfit font-semibold mb-2">
                    {videoLesson?.title || "Introduction to Data Structures"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {videoLesson?.description || "Learn the fundamentals of data structures and how they can be implemented in Python."}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {videoLesson?.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent px-3 py-1 rounded-full">
                        {tag}
                      </Badge>
                    )) || (
                      <>
                        <Badge variant="outline" className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent px-3 py-1 rounded-full">
                          Data Structures
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary px-3 py-1 rounded-full">
                          Python
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-accent/10 dark:bg-accent/20 text-accent px-3 py-1 rounded-full">
                          Algorithms
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img 
                        src={videoLesson?.instructor?.avatarUrl || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"} 
                        alt={videoLesson?.instructor?.name || "Instructor"} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">{videoLesson?.instructor?.name || "Dr. Alex Morgan"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{videoLesson?.instructor?.title || "Computer Science Professor"}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-icons text-gray-500 dark:text-gray-400">bookmark_border</span>
                      </button>
                      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-icons text-gray-500 dark:text-gray-400">share</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <motion.div 
              className="bg-background dark:bg-darkBg rounded-standard p-4 shadow-soft"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="font-outfit font-semibold mb-4">Course Content</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto hide-scrollbar pr-2">
                {isLoading ? (
                  Array(6).fill(0).map((_, index) => (
                    <div key={index} className="p-2">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                ) : (
                  <>
                    {videoLesson?.modules?.map((module, index) => {
                      const moduleIndex = index + 1;
                      const isActive = moduleIndex === activeModule;
                      const isCompleted = moduleIndex < activeModule;
                      const isLocked = moduleIndex > 2; // First two modules available
                      
                      return (
                        <div key={moduleIndex}>
                          <div 
                            className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                              isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => !isLocked && setActiveModule(moduleIndex)}
                          >
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                isActive ? 'bg-primary' : 
                                isLocked ? 'bg-gray-200 dark:bg-gray-700' : 
                                'bg-primary/10 dark:bg-primary/20'
                              }`}>
                                <span className={`material-icons text-sm ${
                                  isActive ? 'text-white' : 
                                  isLocked ? 'text-gray-500 dark:text-gray-400' : 
                                  'text-primary'
                                }`}>
                                  {isLocked ? 'lock' : 'play_arrow'}
                                </span>
                              </div>
                              <span className={`text-sm font-medium ${isActive ? 'text-primary dark:text-accent' : ''}`}>
                                {`${moduleIndex}. ${module.title}`}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{module.duration}</span>
                          </div>
                        </div>
                      );
                    }) || (
                      <>
                        {/* Default modules if no data */}
                        <div>
                          <div className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mr-3">
                                <span className="material-icons text-primary text-sm">play_arrow</span>
                              </div>
                              <span className="text-sm font-medium">1. Introduction</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">10:45</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between cursor-pointer p-2 bg-primary/5 dark:bg-primary/10 rounded-lg transition-colors">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                                <span className="material-icons text-white text-sm">play_arrow</span>
                              </div>
                              <span className="text-sm font-medium text-primary dark:text-accent">2. Arrays & Lists</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">14:20</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                                <span className="material-icons text-gray-500 dark:text-gray-400 text-sm">lock</span>
                              </div>
                              <span className="text-sm font-medium">3. Linked Lists</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">18:30</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Wellness Break */}
                    <div className="my-4 p-3 bg-secondary/10 dark:bg-secondary/20 rounded-lg border-l-2 border-secondary">
                      <div className="flex items-center">
                        <span className="material-icons text-secondary mr-2">self_improvement</span>
                        <span className="text-sm font-medium">Wellness Break</span>
                      </div>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">Take a 5-minute mindfulness exercise before continuing.</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6">
                {lessonCompleted ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" /> Lesson Completed
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-primary hover:bg-opacity-90 text-white"
                    onClick={handleMarkAsCompleted}
                    disabled={completeLessonMutation.isPending}
                  >
                    {completeLessonMutation.isPending ? (
                      <span className="flex items-center">
                        <span className="material-icons animate-spin mr-2">refresh</span> Updating...
                      </span>
                    ) : (
                      "Mark as Completed"
                    )}
                  </Button>
                )}
              </div>
              
              <div className="mt-4">
                <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                  <span className="material-icons text-sm mr-2">picture_as_pdf</span> Download Cheat Sheet
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
