import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactPlayer from "react-player";
// Import specific players to ensure they're bundled correctly
import 'react-player/youtube';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Lock, Play, AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useStreak } from "@/context/streak-context";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { useRoute } from "wouter";
import YouTubeEmbed from "@/components/shared/YouTubeEmbed";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveVideoProgress, getVideoProgress, isLessonCompleted, markLessonAsCompleted, getCourseProgress, updateUserStreaks, getUserStreaks } from "@/utils/localStorageUtils";
import { ProgressOverlay } from "@/components/ui/progress-overlay";
import { useOfflineSync } from "@/hooks/use-offline-sync";

const VideoSection = () => {
  const [playing, setPlaying] = useState(false);
  const [activeModule, setActiveModule] = useState(1);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const [showProgressTooltip, setShowProgressTooltip] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [activityTimer, setActivityTimer] = useState<number>(0);
  const [hasUpdatedStreakToday, setHasUpdatedStreakToday] = useState<boolean>(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const activityTimeout = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const [match, params] = useRoute("/courses/:id");
  const courseId = match ? params.id : null; // Changed to string to match our localStorage utils
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateStreak } = useStreak();
  const queryClient = useQueryClient();

  // Add offline sync hook
  const { isOnline: networkIsOnline, isSyncing, hasPendingItems, sync } = useOfflineSync({
    showNotifications: true,
    autoSync: true,
    invalidateQueries: [
      "/api/user/progress",
      "/api/courses",
      `/api/courses/${courseId}`,
      "/api/lessons/featured"
    ]
  });

  // Use networkIsOnline from the hook instead of our local state
  useEffect(() => {
    setIsOnline(networkIsOnline);
  }, [networkIsOnline]);

  // Check if the streak has already been updated today
  useEffect(() => {
    const checkLastStreakUpdate = () => {
      const lastUpdate = localStorage.getItem('lastStreakUpdate');
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        const today = new Date();

        // Check if the last update was today
        if (lastUpdateDate.toDateString() === today.toDateString()) {
          setHasUpdatedStreakToday(true);
        }
      }
    };

    checkLastStreakUpdate();
  }, []);

  // Activity tracking for streak update
  useEffect(() => {
    if (!user || hasUpdatedStreakToday) return;

    // Start/restart timer for user activity tracking
    if (activityTimeout.current) {
      clearInterval(activityTimeout.current);
    }

    activityTimeout.current = setInterval(() => {
      setActivityTimer(prev => {
        const newTime = prev + 1;

        // If user has been active for 10 seconds and streak hasn't been updated today
        if (newTime >= 10 && !hasUpdatedStreakToday) {
          // Update streak
          const streaks = updateUserStreaks();
          updateStreak(streaks.currentStreak);

          // Mark as updated today to prevent multiple updates
          setHasUpdatedStreakToday(true);

          // Clear the interval since we've updated the streak
          if (activityTimeout.current) {
            clearInterval(activityTimeout.current);
          }

          console.log(`User has been active for 10 seconds, updated streak to ${streaks.currentStreak}`);
        }

        return newTime;
      });
    }, 1000);

    // Cleanup interval on unmount
    return () => {
      if (activityTimeout.current) {
        clearInterval(activityTimeout.current);
      }
    };
  }, [user, hasUpdatedStreakToday, updateStreak]);

  // Reset hasUpdatedStreakToday flag at midnight
  useEffect(() => {
    const checkForNewDay = () => {
      const lastUpdate = localStorage.getItem('lastStreakUpdate');
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        const today = new Date();

        // If it's a new day, reset the flag
        if (lastUpdateDate.toDateString() !== today.toDateString()) {
          setHasUpdatedStreakToday(false);
        }
      }
    };

    // Check for new day immediately
    checkForNewDay();

    // Set up interval to check periodically (every minute)
    const dayCheckInterval = setInterval(checkForNewDay, 60000);

    return () => clearInterval(dayCheckInterval);
  }, []);

  // User interaction event listeners to track activity
  useEffect(() => {
    const resetActivityTimer = () => {
      setActivityTimer(0);
    };

    // Add event listeners for different user activities
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
    window.addEventListener('scroll', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      window.removeEventListener('scroll', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
    };
  }, []);

  // Constants
  const COMPLETION_THRESHOLD = 80; // 80% of the video must be watched to mark as completed

  // Get course progress
  const { data: courseProgress, isLoading: isProgressLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId && !!user && isOnline,
  }) as { data: any, isLoading: boolean };

  // Streak context is already imported at the top level

  const { data: videoLesson, isLoading, error: videoError } = useQuery({
    queryKey: ['/api/lessons/featured'],
    enabled: isOnline,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error("Error fetching video lesson:", error);
      toast({
        title: "Error Loading Video",
        description: "We're having trouble loading the video content. Using fallback content instead.",
        variant: "destructive",
      });
    }
  }) as { data: any, isLoading: boolean, error: any };

  // If offline or error, load video data from a mock object
  useEffect(() => {
    if ((!isOnline && !videoLesson) || videoError) {
      // Set mock data when offline/error and no data is available yet
      const mockLesson = {
        id: "offline-lesson-1",
        title: "Introduction to Data Structures",
        description: "Learn the fundamentals of data structures and how they can be implemented in Python. This content is available even when offline or when there are connection issues.",
        videoUrl: "https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h", // Provided video lecture
        thumbnailUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
        tags: ["Data Structures", "Python", "Algorithms"],
        instructor: {
          name: "Dr. Alex Morgan",
          title: "Computer Science Professor",
          avatarUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
        },
        modules: [
          { title: "Introduction", duration: "10:45" },
          { title: "Arrays & Lists", duration: "14:20" },
          { title: "Linked Lists", duration: "18:30" }
        ]
      };

      // @ts-ignore - Set mock data directly
      setVideoLesson(mockLesson);

      if (videoError) {
        console.log("Using fallback video due to API error:", videoError);
      }
    }
  }, [isOnline, videoLesson, videoError]);

  // Mutation to update watch progress
  const updateWatchProgressMutation = useMutation({
    mutationFn: async ({ lessonId, progress }: { lessonId: string | number, progress: number }) => {
      if (!isOnline) {
        // Use localStorage when offline
        saveVideoProgress(String(lessonId), progress);
        return { watchProgress: progress };
      }

      const response = await apiRequest("POST", `/api/lessons/${lessonId}/progress`, { progress });
      return response.json();
    },
    onSuccess: (data) => {
      // If the watch progress is above the threshold, enable the completion button
      if (data.watchProgress >= COMPLETION_THRESHOLD) {
        setCanComplete(true);
      }
      setWatchProgress(data.watchProgress);
    },
    onError: (error) => {
      console.error("Error updating watch progress:", error);
    },
  });

  // Check if the lesson is already completed or has progress
  useEffect(() => {
    if (courseProgress && videoLesson) {
      // Check if this specific lesson is completed
      const checkLessonCompletion = async () => {
        try {
          if (user && videoLesson.id) {
            if (!isOnline) {
              // Use localStorage when offline
              const completed = isLessonCompleted(String(videoLesson.id));
              const progress = getVideoProgress(String(videoLesson.id));

              if (completed) {
                setLessonCompleted(true);
              }

              if (progress) {
                setWatchProgress(progress);
                if (progress >= COMPLETION_THRESHOLD) {
                  setCanComplete(true);
                }
              }

              return;
            }

            // Use API when online
            const response = await apiRequest("GET", `/api/lessons/${videoLesson.id}/completion`);
            const data = await response.json();

            if (data.completed) {
              setLessonCompleted(true);
            }

            if (data.watchProgress) {
              setWatchProgress(data.watchProgress);
              if (data.watchProgress >= COMPLETION_THRESHOLD) {
                setCanComplete(true);
              }
            }
          }
        } catch (error) {
          console.error("Error checking lesson completion:", error);

          // Fallback to localStorage if API fails
          if (user && videoLesson.id) {
            const completed = isLessonCompleted(String(videoLesson.id));
            const progress = getVideoProgress(String(videoLesson.id));

            if (completed) {
              setLessonCompleted(true);
            }

            if (progress) {
              setWatchProgress(progress);
              if (progress >= COMPLETION_THRESHOLD) {
                setCanComplete(true);
              }
            }
          }
        }
      };

      checkLessonCompletion();
    }
  }, [courseProgress, videoLesson, user, isOnline]);

  // Mutation to mark lesson as completed
  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string | number) => {
      if (!isOnline) {
        // Use localStorage when offline
        if (courseId) {
          // We need the module index, assuming we're in the first module (0-based in the array, 1-based in UI)
          markLessonAsCompleted(String(lessonId), String(courseId), activeModule - 1);
          const streaks = updateUserStreaks();
          // Update streak locally - extract currentStreak from UserStreaks object
          updateStreak(streaks.currentStreak);
          return { completed: true, streak: streaks.currentStreak };
        }
        return { completed: true };
      }

      // Use API when online
      const response = await apiRequest("POST", `/api/lessons/${lessonId}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      setLessonCompleted(true);

      // Automatically unlock next module
      if (videoLesson?.modules && activeModule < videoLesson.modules.length) {
        setActiveModule(activeModule + 1);
      }

      toast({
        title: "Lesson Completed!",
        description: "Your progress has been updated and next lesson unlocked.",
        variant: "default",
      });

      // Force trigger course progress update
      triggerCourseProgressUpdate();

      if (isOnline) {
        // Only invalidate queries when online
        queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });

        // Instead of just invalidating, update the cache directly with the new progress
        if (courseId && data.progress !== undefined) {
          // Get the current data from the cache
          const currentData = queryClient.getQueryData([`/api/courses/${courseId}`]);

          if (currentData) {
            // Update the cache with the new progress data
            queryClient.setQueryData([`/api/courses/${courseId}`], {
              ...currentData,
              completedLessons: data.completedLessons || (currentData as any).completedLessons + 1,
              progress: data.progress || Math.min(100, ((currentData as any).completedLessons + 1) * 10)
            });
          }
        } else {
          // If we don't have the data, just invalidate the query
          queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
        }
      }

      // Update streak if returned in the response
      if (data.streak) {
        try {
          // Enhanced type checking to ensure we always pass a number
          let streakValue: number;

          if (typeof data.streak === 'object') {
            // Handle UserStreaks-like object
            if ('currentStreak' in data.streak && typeof data.streak.currentStreak === 'number') {
              streakValue = data.streak.currentStreak;
            } else {
              // If it's an object without currentStreak, use a default of 1
              console.warn('Received streak object without currentStreak property', data.streak);
              streakValue = 1;
            }
          } else if (typeof data.streak === 'number') {
            // Direct number value
            streakValue = data.streak;
          } else {
            // Any other type, try to convert to number or default to 1
            console.warn('Received unexpected streak type:', typeof data.streak);
            streakValue = Number(data.streak) || 1;
          }

          // Now we can safely pass a number
          updateStreak(streakValue);
        } catch (error) {
          console.error("Error updating streak:", error);
        }
      }
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

  // Handle video progress
  const handleProgress = ({ played }: { played: number }) => {
    // Convert to percentage (0-100)
    const progressPercent = Math.floor(played * 100);

    // Only update if progress increases significantly (every 5%)
    if (progressPercent > watchProgress && progressPercent % 5 === 0) {
      if (user && videoLesson?.id) {
        updateWatchProgressMutation.mutate({
          lessonId: videoLesson.id,
          progress: progressPercent
        });
      }
    }
  };

  // Handle video end
  const handleEnded = () => {
    if (user && videoLesson?.id) {
      // Update to 100% when video ends
      updateWatchProgressMutation.mutate({
        lessonId: videoLesson.id,
        progress: 100
      });
      setCanComplete(true);
    }
  };

  // Get offline course progress if needed
  const offlineCourseProgress = courseId && !isOnline ? getCourseProgress(String(courseId)) : null;
  const effectiveCourseProgress = isOnline ? courseProgress : offlineCourseProgress;

  // Function to check if a module is completed in offline mode
  const isModuleCompletedOffline = (moduleIndex: number) => {
    if (!courseId || !offlineCourseProgress) return false;
    return offlineCourseProgress.completedModules.includes(moduleIndex);
  };

  // Function to check if a module is unlocked - improved to ensure proper unlocking
  const isModuleUnlocked = (moduleIndex: number) => {
    // First module is always unlocked
    if (moduleIndex === 0 || moduleIndex === 1) return true;

    // Previous module completed means this one is unlocked
    if (isOnline && effectiveCourseProgress?.completedModules) {
      // Check if previous module is completed (0-indexed in the backend but 1-indexed in UI)
      return effectiveCourseProgress.completedModules.includes(moduleIndex - 2) ||
             effectiveCourseProgress.completedModules.includes(moduleIndex - 1);
    } else if (!isOnline && offlineCourseProgress) {
      // Check both possible indexing schemes to be safe
      return isModuleCompletedOffline(moduleIndex - 2) ||
             isModuleCompletedOffline(moduleIndex - 1);
    }

    // Default to false if no progress data
    return false;
  };

  // Function to trigger a course progress update event
  const triggerCourseProgressUpdate = () => {
    if (effectiveCourseProgress) {
      // Create a copy to force React to detect the change
      const updatedProgress = {
        ...effectiveCourseProgress,
        // Ensure we increment these values to reflect the new completion
        completedLessons: (effectiveCourseProgress.completedLessons || 0) + 1,
      };

      // If not already in completed modules, add it
      if (effectiveCourseProgress.completedModules &&
          !effectiveCourseProgress.completedModules.includes(activeModule - 1)) {
        updatedProgress.completedModules = [
          ...(effectiveCourseProgress.completedModules || []),
          activeModule - 1
        ];
      }

      // Recalculate progress percentage
      updatedProgress.progress = Math.min(
        100,
        updatedProgress.completedLessons * 10 // Simple calculation based on completed lessons
      );

      // Update the effectiveCourseProgress directly to ensure UI updates
      if (isOnline && courseProgress) {
        // For online mode, update the queryClient cache
        queryClient.setQueryData([`/api/courses/${courseId}`], {
          ...courseProgress,
          completedLessons: updatedProgress.completedLessons,
          completedModules: updatedProgress.completedModules,
          progress: updatedProgress.progress
        });
      }

      // Dispatch event to update course overview
      const progressUpdateEvent = new CustomEvent('course-progress-updated', {
        detail: {
          courseId,
          progress: updatedProgress.progress,
          completedLessons: updatedProgress.completedLessons,
          completedModules: updatedProgress.completedModules
        }
      });
      document.dispatchEvent(progressUpdateEvent);

      // Update document title with progress
      document.title = `Course (${Math.round(updatedProgress.progress || 0)}%) - Learning Platform`;
    }
  };

  // Add useEffect to update document title and trigger course overview update
  // We only want to run this once when the component mounts or when courseId changes
  // NOT every time effectiveCourseProgress changes, as that creates an infinite loop
  useEffect(() => {
    if (effectiveCourseProgress) {
      // Update document title with progress
      document.title = `Course (${Math.round(effectiveCourseProgress.progress || 0)}%) - Learning Platform`;

      // Only dispatch the event, don't call triggerCourseProgressUpdate which modifies state
      const progressUpdateEvent = new CustomEvent('course-progress-updated', {
        detail: {
          courseId,
          progress: effectiveCourseProgress.progress,
          completedLessons: effectiveCourseProgress.completedLessons,
          completedModules: effectiveCourseProgress.completedModules
        }
      });
      document.dispatchEvent(progressUpdateEvent);
    }
  }, [courseId]);

  // Add a sync button to the UI when there are pending items
  const renderSyncButton = () => {
    if (!isOnline || !hasPendingItems) return null;

    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center text-sm"
          onClick={sync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing offline progress...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync offline progress
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl">
        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900 rounded-lg border-l-2 border-amber-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
              <span className="text-sm font-medium">You are currently offline. Progress will be saved locally.</span>
            </div>
          </div>
        )}

        {renderSyncButton()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <motion.div
              className="bg-black rounded-standard overflow-hidden shadow-md relative aspect-video"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {isLoading && isOnline ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <>
                  {playing ? (
                    <div className="absolute inset-0">
                      {useIframeFallback ? (
                        // Use the simple iframe-based YouTube embed as a fallback
                        <YouTubeEmbed
                          videoId={videoLesson?.videoUrl || "https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h"}
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
                                onClick={() => {
                                  setPlaying(false);
                                  setTimeout(() => setPlaying(true), 500);
                                }}
                                variant="outline"
                                className="bg-primary text-white hover:bg-primary/90"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" /> Retry
                              </Button>
                              <Button
                                onClick={() => setUseIframeFallback(true)}
                                variant="secondary"
                              >
                                Use Fallback Player
                              </Button>
                            </div>
                          </div>

                          {/* The actual ReactPlayer with z-index to appear above the fallback */}
                          <div className="absolute inset-0 z-10">
                            <ReactPlayer
                              ref={playerRef}
                              url={videoLesson?.videoUrl || "https://youtu.be/NClmyC6olC0?si=UFT-wjVpJ7Q2Sa9h"}
                              width="100%"
                              height="100%"
                              controls={true}
                              playing={playing}
                              onProgress={handleProgress}
                              onEnded={handleEnded}
                              onError={(e) => {
                                console.error("Video playback error:", e);
                                toast({
                                  title: "Video Playback Error",
                                  description: "We're having trouble playing this video. Try using the fallback player.",
                                  variant: "destructive",
                                });
                                // Suggest using the fallback player
                                setUseIframeFallback(true);
                              }}
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
              {isLoading && isOnline ? (
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
                    {videoLesson?.tags ? (
                      // Parse JSON string to array if it's a string, otherwise use as is
                      (typeof videoLesson.tags === 'string' ?
                        JSON.parse(videoLesson.tags) :
                        videoLesson.tags
                      ).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent px-3 py-1 rounded-full">
                          {tag}
                        </Badge>
                      ))
                    ) : (
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
                {isLoading && isOnline ? (
                  Array(6).fill(0).map((_, index) => (
                    <div key={index} className="p-2">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                ) : (
                  <>
                    {videoLesson?.modules?.map((module: any, index: number) => {
                      const moduleIndex = index + 1;
                      const isActive = moduleIndex === activeModule;
                      const isCompleted = isOnline
                        ? effectiveCourseProgress?.completedModules?.includes(moduleIndex - 1)
                        : isModuleCompletedOffline(moduleIndex - 1);

                      // Check if this module is unlocked
                      const isUnlocked = isModuleUnlocked(moduleIndex);

                      return (
                        <div key={moduleIndex}>
                          <div
                            className={`flex items-center justify-between cursor-pointer p-2 rounded-lg transition-colors ${
                              isActive ? 'bg-primary/5 dark:bg-primary/10' :
                              isUnlocked ? 'hover:bg-gray-100 dark:hover:bg-gray-700' :
                              'opacity-70'
                            }`}
                            onClick={() => isUnlocked && setActiveModule(moduleIndex)}
                          >
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                isActive ? 'bg-primary' :
                                !isUnlocked ? 'bg-gray-200 dark:bg-gray-700' :
                                isCompleted ? 'bg-green-500' :
                                'bg-primary/10 dark:bg-primary/20'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                ) : (
                                  !isUnlocked ? (
                                    <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  ) : (
                                    <Play className="h-4 w-4 text-primary" />
                                  )
                                )}
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

              <div className="mt-6 space-y-4">
                {user && effectiveCourseProgress && (
                  <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm font-medium">Course Progress</span>
                      </div>
                      <span className="text-sm font-medium">{Math.round(effectiveCourseProgress.progress || 0)}%</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, effectiveCourseProgress.progress || 0))} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{effectiveCourseProgress.completedLessons} lessons completed</span>
                      <span>{effectiveCourseProgress.quizzesPassed || 0} quizzes passed</span>
                    </div>
                  </div>
                )}

                {lessonCompleted ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" /> Lesson Completed
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip open={!canComplete && showProgressTooltip} onOpenChange={setShowProgressTooltip}>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <ProgressOverlay progress={watchProgress} color="bg-primary-foreground/20">
                            <Button
                              className="w-full bg-primary hover:bg-opacity-90 text-white"
                              onClick={handleMarkAsCompleted}
                              disabled={completeLessonMutation.isPending || !canComplete}
                              onMouseEnter={() => !canComplete && setShowProgressTooltip(true)}
                              onMouseLeave={() => setShowProgressTooltip(false)}
                            >
                              {completeLessonMutation.isPending ? (
                                <span className="flex items-center">
                                  <span className="material-icons animate-spin mr-2">refresh</span> Updating...
                                </span>
                              ) : canComplete ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Completed
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 mr-2" /> Watch More to Complete ({watchProgress}%)
                                </>
                              )}
                            </Button>
                          </ProgressOverlay>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Watch at least {COMPLETION_THRESHOLD}% of the video to mark as completed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
