import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CourseCard from "@/components/shared/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ReferenceLine } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import StreakPopup from "@/components/shared/StreakPopup";

// Simple game component
const CodeBreakGame = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [targets, setTargets] = useState<{id: number, x: number, y: number, size: number}[]>([]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    generateTargets();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateTargets = () => {
    const newTargets = Array.from({length: 5}, (_, i) => ({
      id: i,
      x: Math.floor(Math.random() * 80) + 5, // 5-85% of container width
      y: Math.floor(Math.random() * 70) + 10, // 10-80% of container height
      size: Math.floor(Math.random() * 20) + 20 // 20-40px size
    }));
    setTargets(newTargets);
  };

  const hitTarget = (id: number) => {
    setScore(prev => prev + 10);
    setTargets(prev => prev.filter(target => target.id !== id));

    if (targets.length <= 1) {
      generateTargets();
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>Code Break - Focus Game</span>
          {gameActive && <span className="text-sm">Time: {timeLeft}s</span>}
        </CardTitle>
        <CardDescription>
          Take a quick break and reset your focus with this simple game
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden"
          style={{cursor: gameActive ? 'crosshair' : 'default'}}
        >
          {!gameActive ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="mb-4 text-lg font-medium">Ready for a quick brain break?</p>
              <Button onClick={startGame} className="bg-primary">Start Game</Button>
            </div>
          ) : (
            <>
              <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-sm">
                Score: {score}
              </div>
              {targets.map(target => (
                <motion.div
                  key={target.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bg-primary rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.size}px`,
                    height: `${target.size}px`,
                  }}
                  onClick={() => hitTarget(target.id)}
                >
                  {target.size < 30 ? '+' : '{}'}
                </motion.div>
              ))}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-500 w-full text-center">
          {gameActive
            ? "Click on the targets as fast as you can!"
            : score > 0
              ? `Game over! Your score: ${score}`
              : "Click targets to earn points. Improve focus while having fun!"}
        </div>
      </CardFooter>
    </Card>
  );
};

// Add this component at the top of the file, after the imports
const QuizScoreChart = ({ quizResults }: { quizResults: any[] }) => {
  if (!quizResults || quizResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No quiz data available</p>
      </div>
    );
  }

  // Process data for the chart
  const data = quizResults
    .slice(0, 7) // Show only most recent 7 quizzes
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(quiz => ({
      name: quiz.title.substring(0, 10) + (quiz.title.length > 10 ? '...' : ''),
      score: quiz.score,
      passing: quiz.passed ? 'Passed' : 'Failed'
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
          <ReferenceLine y={70} stroke="rgba(255, 99, 71, 0.5)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-primary)',
              r: 5,
              strokeWidth: 1
            }}
            activeDot={{
              r: 8,
              stroke: 'var(--color-primary)',
              strokeWidth: 2
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [mergedQuizData, setMergedQuizData] = useState<any>(null);

  // Track user activity on dashboard with 'study' activity type
  useActivityTracker({ activityType: 'study' });

  // Get user's fullName or username
  const userName = user?.fullName || user?.username || "Student";

  // Mock user stats since we don't have these in our schema yet
  const userStats = {
    streak: 5,
    points: 1250
  };

  // Fetch courses
  const { data: courses, isLoading: loadingCourses } = useQuery<any>({
    queryKey: ['/api/courses'],
  });

  // Fetch user progress data
  const { data: userProgressData, isLoading: loadingProgress } = useQuery<any>({
    queryKey: ['/api/user/progress'],
    enabled: !!user, // Only run if user is authenticated
  });

  // Use local storage as fallback for quiz results
  useEffect(() => {
    if (userProgressData) {
      try {
        // Get local storage quiz results
        const storedResults = localStorage.getItem('quizResults');
        const localResults = storedResults ? JSON.parse(storedResults) : [];

        if (localResults.length === 0) {
          // No local results, just use server data
          setMergedQuizData(userProgressData);
          return;
        }

        // Create merged data object
        const mergedData = {
          ...userProgressData,
          quizResults: [...(userProgressData.quizResults || [])],
          stats: { ...(userProgressData.stats || {}) }
        };

        // Get quiz IDs from server to avoid duplicates
        const serverQuizIds = new Set((userProgressData.quizResults || []).map((r: any) => r.quizId));

        // Filter to unique local results
        const uniqueLocalResults = localResults.filter((r: any) => !serverQuizIds.has(r.quizId));

        if (uniqueLocalResults.length === 0) {
          // No unique local results, just use server data
          setMergedQuizData(userProgressData);
          return;
        }

        // Format local results to match server format
        const formattedLocalResults = uniqueLocalResults.map((result: any) => ({
          id: result.id,
          quizId: result.quizId,
          title: `Quiz ${result.quizId}`, // Best guess without server data
          score: result.score,
          passed: result.passed,
          timestamp: result.createdAt,
          totalQuestions: 5, // Reasonable default
          fromLocalStorage: true
        }));

        // Add local results to merged data
        mergedData.quizResults = [...mergedData.quizResults, ...formattedLocalResults];

        // Update stats with local data
        const passedLocalQuizIds = new Set(
          uniqueLocalResults.filter((r: any) => r.passed).map((r: any) => r.quizId)
        );

        mergedData.stats.quizzesPassed = (mergedData.stats.quizzesPassed || 0) + passedLocalQuizIds.size;
        mergedData.stats.quizzesAttempted = (mergedData.stats.quizzesAttempted || 0) + uniqueLocalResults.length;

        // Calculate new average score including local results
        const allScores = [
          ...(userProgressData.quizResults || []).map((r: any) => r.score),
          ...uniqueLocalResults.map((r: any) => r.score)
        ];

        if (allScores.length > 0) {
          const newAverage = Math.round(allScores.reduce((sum: number, score: number) => sum + score, 0) / allScores.length);
          mergedData.stats.averageScore = `${newAverage}%`;
        }

        console.log('Merged with local data:', mergedData);
        setMergedQuizData(mergedData);
      } catch (error) {
        console.error('Error merging local data:', error);
        // Fallback to server data only
        setMergedQuizData(userProgressData);
      }
    } else if (!loadingProgress) {
      // If server fetch failed, try to use local data only
      try {
        const storedResults = localStorage.getItem('quizResults');
        const localResults = storedResults ? JSON.parse(storedResults) : [];

        if (localResults.length === 0) {
          return; // No data available
        }

        // Create fallback data structure from local storage
        const fallbackData = {
          quizResults: localResults.map((result: any) => ({
            id: result.id,
            quizId: result.quizId,
            title: `Quiz ${result.quizId}`,
            score: result.score,
            passed: result.passed,
            timestamp: result.createdAt,
            totalQuestions: 5,
            fromLocalStorage: true
          })),
          stats: {
            quizzesPassed: new Set(localResults.filter((r: any) => r.passed).map((r: any) => r.quizId)).size,
            quizzesAttempted: new Set(localResults.map((r: any) => r.quizId)).size,
            averageScore: `${Math.round(localResults.reduce((sum: number, r: any) => sum + r.score, 0) / localResults.length)}%`,
            streak: 0,
            totalQuizzes: 0
          }
        };

        setMergedQuizData(fallbackData);
      } catch (error) {
        console.error('Error using local fallback data:', error);
      }
    }
  }, [userProgressData, loadingProgress]);

  // Generate weekly activity data from real user progress
  const progressData = useMemo(() => {
    if (!userProgressData?.recentActivity) {
      // Fallback data when no activity is available
      return [
        { name: 'Mon', study: 0, mental: 0 },
        { name: 'Tue', study: 0, mental: 0 },
        { name: 'Wed', study: 0, mental: 0 },
        { name: 'Thu', study: 0, mental: 0 },
        { name: 'Fri', study: 0, mental: 0 },
        { name: 'Sat', study: 0, mental: 0 },
        { name: 'Sun', study: 0, mental: 0 },
      ];
    }

    // Process real data from user activity
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create empty days for current week
    const weekData = dayNames.map(name => ({
      name,
      study: 0,
      mental: 0
    }));

    // Fill in data from user activity
    if (userProgressData.recentActivity && Array.isArray(userProgressData.recentActivity)) {
      // Get activity from the last 7 days
      const lastWeekActivity = userProgressData.recentActivity.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp);
        const diffTime = today.getTime() - activityDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      // Aggregate activity by day
      lastWeekActivity.forEach((activity: any) => {
        const activityDate = new Date(activity.timestamp);
        const dayIndex = activityDate.getDay(); // 0 = Sunday, 6 = Saturday

        if (activity.type === 'lesson' || activity.type === 'quiz' || activity.type === 'timeSpent') {
          // If it's time tracking, add the actual duration (converted from seconds to minutes)
          if (activity.type === 'timeSpent' && activity.duration && activity.activityType === 'study') {
            weekData[dayIndex].study += Math.floor(activity.duration / 60);
          } else {
            weekData[dayIndex].study += 10; // Count other learning activities as some minutes
          }
        }

        if (activity.type === 'mood' || activity.type === 'breathing' ||
           (activity.type === 'timeSpent' && activity.activityType === 'mental')) {
          // If it's time tracking, add the actual duration
          if (activity.type === 'timeSpent' && activity.duration && activity.activityType === 'mental') {
            weekData[dayIndex].mental += Math.floor(activity.duration / 60);
          } else {
            weekData[dayIndex].mental += 5; // Count mental health activities
          }
        }
      });
    }

    // If we have mood entries, add them to mental health time
    if (userProgressData.moodEntries && Array.isArray(userProgressData.moodEntries)) {
      userProgressData.moodEntries.forEach((entry: any) => {
        const entryDate = new Date(entry.createdAt);
        const diffTime = today.getTime() - entryDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          const dayIndex = entryDate.getDay();
          weekData[dayIndex].mental += 5; // Count each mood entry as 5 minutes
        }
      });
    }

    // Rearrange to start with current day
    const todayIndex = today.getDay();
    return [...weekData.slice(todayIndex + 1), ...weekData.slice(0, todayIndex + 1)];
  }, [userProgressData?.recentActivity, userProgressData?.moodEntries]);

  // Convert mood entries to chart data
  const moodData = useMemo(() => {
    if (!userProgressData?.moodEntries || !Array.isArray(userProgressData.moodEntries)) {
      return [
        { name: 'Good', value: 0, color: '#4CAF50' },
        { name: 'Okay', value: 0, color: '#FFC107' },
        { name: 'Struggling', value: 0, color: '#F44336' },
      ];
    }

    // Count occurrences of each mood
    const moodCounts = {
      'Good': 0,
      'Okay': 0,
      'Struggling': 0
    };

    userProgressData.moodEntries.forEach((entry: any) => {
      if (moodCounts[entry.mood as keyof typeof moodCounts] !== undefined) {
        moodCounts[entry.mood as keyof typeof moodCounts]++;
      }
    });

    return [
      { name: 'Good', value: moodCounts.Good || 0, color: '#4CAF50' },
      { name: 'Okay', value: moodCounts.Okay || 0, color: '#FFC107' },
      { name: 'Struggling', value: moodCounts.Struggling || 0, color: '#F44336' },
    ];
  }, [userProgressData?.moodEntries]);

  // Learning goals based on user progress
  const learningGoals = useMemo(() => {
    if (!userProgressData?.progress || !Array.isArray(userProgressData.progress)) {
      return [
        { id: 1, title: "Complete First Course", progress: 0 },
        { id: 2, title: "Pass Your First Quiz", progress: 0 },
        { id: 3, title: "Practice Daily", progress: 0 },
      ];
    }

    // Create goals based on actual courses
    return userProgressData.progress
      .filter((course: any) => course.progress < 100) // Only include incomplete courses
      .slice(0, 3)  // Take at most 3
      .map((course: any, index: number) => ({
        id: index + 1,
        title: `Complete ${course.courseTitle}`,
        progress: course.progress
      }));
  }, [userProgressData?.progress]);

  // Upcoming sessions (mocked)
  const upcomingSessions = [
    { id: 1, title: "JavaScript Advanced Concepts", date: "March 28, 2025", time: "15:00" },
    { id: 2, title: "Group Study: Algorithms", date: "March 30, 2025", time: "18:30" },
  ];

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Add helper function to format time
  const formatTimeTaken = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSec = seconds % 60;
    return `${minutes}m ${remainingSec}s`;
  };

  // Existing state and hooks
  const [selectedView, setSelectedView] = useState<string>("today");
  const [localStreak, setLocalStreak] = useState(0);
  const [localPoints, setLocalPoints] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  // Initialize local streak and points from userProgressData or localStorage
  useEffect(() => {
    // Initialize streak
    if (userProgressData?.stats?.streak !== undefined) {
      setLocalStreak(userProgressData.stats.streak);
    } else {
      // Fallback to localStorage
      const savedStreak = localStorage.getItem('userStreak');
      if (savedStreak) {
        const parsedStreak = parseInt(savedStreak);
        if (!isNaN(parsedStreak)) {
          setLocalStreak(parsedStreak);
        }
      }
    }

    // Initialize points
    if (userProgressData?.stats?.completedQuizzes !== undefined) {
      setLocalPoints(userProgressData.stats.completedQuizzes);
    } else {
      // Fallback to localStorage
      const savedPoints = localStorage.getItem('userPoints');
      if (savedPoints) {
        const parsedPoints = parseInt(savedPoints);
        if (!isNaN(parsedPoints)) {
          setLocalPoints(parsedPoints);
        }
      }
    }
  }, [userProgressData?.stats?.streak, userProgressData?.stats?.completedQuizzes]);

  // Function to show the streak popup
  const showStreakUpdatePopup = (streak: number) => {
    console.log('Showing streak popup for streak:', streak);
    setShowStreakPopup(true);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowStreakPopup(false);
    }, 4000);
  };

  return (
    <MainLayout>
      {/* Streak popup */}
      {showStreakPopup && (
        <StreakPopup
          streak={localStreak}
          onClose={() => setShowStreakPopup(false)}
        />
      )}

      <div className="bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-darkBg py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Welcome & Stats Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <motion.div
              className="mb-6 md:mb-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-outfit font-bold">
                Welcome back, {userName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Let's continue your learning journey today.
              </p>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center">
                <span className="material-icons text-primary">local_fire_department</span>
                <span className="ml-1 font-medium">{localStreak} day streak</span>
                <button
                  className="ml-2 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-full px-2 py-1 mr-1"
                  onClick={async () => {
                    try {
                      console.log('Manually updating streak via dashboard button');

                      // Update local state immediately
                      const newStreak = localStreak + 1;
                      const newPoints = localPoints + 10; // Increase points by 10 for each streak increment
                      setLocalStreak(newStreak);
                      setLocalPoints(newPoints);

                      // Update localStorage
                      localStorage.setItem('userStreak', newStreak.toString());
                      localStorage.setItem('userPoints', newPoints.toString());
                      localStorage.setItem('lastStreakUpdate', new Date().toISOString());

                      // Show streak popup
                      showStreakUpdatePopup(newStreak);

                      // Show visual feedback on button
                      const button = document.activeElement as HTMLElement;
                      if (button) {
                        button.classList.add('bg-green-200', 'dark:bg-green-800');
                        setTimeout(() => {
                          button.classList.remove('bg-green-200', 'dark:bg-green-800');
                        }, 500);
                      }

                      // Try to update server in background
                      fetch('/api/debug/update-streak', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          streak: newStreak,
                          force: true
                        })
                      })
                      .then(response => response.json())
                      .then(data => {
                        console.log('Server streak updated:', data);

                        // Dispatch event for other components
                        window.dispatchEvent(new CustomEvent('streakUpdated', {
                          detail: { streak: newStreak }
                        }));

                        // Show popup
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('forceShowStreakPopup'));
                        }, 500);

                        // Refresh data in background
                        queryClient.invalidateQueries({ queryKey: ['/api/user/progress'] });
                      })
                      .catch(error => {
                        console.error('Error updating streak on server:', error);
                        // UI already updated, so no need to show error
                      });
                    } catch (error) {
                      console.error('Error updating streak:', error);
                      // Still update the UI even if there's an error
                      const newStreak = localStreak + 1;
                      const newPoints = localPoints + 10;
                      setLocalStreak(newStreak);
                      setLocalPoints(newPoints);
                      localStorage.setItem('userStreak', newStreak.toString());
                      localStorage.setItem('userPoints', newPoints.toString());

                      // Still try to show the popup
                      showStreakUpdatePopup(newStreak);
                    }
                  }}
                >
                  +1
                </button>

                {/* Add a decrement button */}
                <button
                  className="text-xs text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50 rounded-full px-2 py-1"
                  onClick={() => {
                    try {
                      console.log('Decrementing streak in UI');

                      // Only decrement if streak is greater than 0
                      if (localStreak > 0) {
                        // Update local state immediately - only decrease streak, not points
                        const newStreak = localStreak - 1;
                        setLocalStreak(newStreak);

                        // Update localStorage
                        localStorage.setItem('userStreak', newStreak.toString());
                        localStorage.setItem('lastStreakUpdate', new Date().toISOString());

                        // Show visual feedback
                        const button = document.activeElement as HTMLElement;
                        if (button) {
                          button.classList.add('bg-red-400', 'dark:bg-red-600');
                          setTimeout(() => {
                            button.classList.remove('bg-red-400', 'dark:bg-red-600');
                          }, 500);
                        }

                        // Try to update server in background
                        fetch('/api/debug/update-streak', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            streak: newStreak,
                            force: true
                          })
                        })
                        .then(response => response.json())
                        .then(data => {
                          console.log('Server streak updated:', data);
                        })
                        .catch(error => {
                          console.error('Error updating streak on server:', error);
                        });
                      } else {
                        console.log('Streak already at 0, cannot decrement');
                      }
                    } catch (error) {
                      console.error('Error updating streak UI:', error);
                    }
                  }}
                >
                  -1
                </button>
              </div>
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center">
                <span className="material-icons text-primary">stars</span>
                <span className="ml-1 font-medium">{localPoints} points</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Continue Learning */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>
                  Pick up where you left off
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCourses ? (
                  <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses && Array.isArray(courses) && courses.slice(0, 2).map((course: any) => (
                      <div key={course.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center mb-2">
                          <div className="h-12 w-12 rounded-md overflow-hidden mr-3">
                            <img src={course.imageUrl} alt={course.title} className="object-cover h-full w-full" />
                          </div>
                          <div>
                            <h3 className="font-outfit font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{course.level} • {course.duration}</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <Progress value={Math.min(100, Math.max(0, course.progress || 0))} className="h-2" />
                          <div className="flex justify-between text-xs mt-1">
                            <span>{Math.round(course.progress || 0)}% complete</span>
                            <span>{course.lectureCount} lectures</span>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-2 bg-primary hover:bg-primary/90"
                          onClick={() => location.href = `/courses/${course.id}`}
                        >
                          Continue Course
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => location.href = "/courses"}
                >
                  View All Courses
                </Button>
              </CardFooter>
            </Card>

            {/* Active Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Goals</CardTitle>
                <CardDescription>
                  Track your progress towards goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningGoals.map((goal: { id: number; title: string; progress: number }) => (
                    <div key={goal.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-sm text-gray-500">{goal.progress || 0}%</span>
                      </div>
                      <Progress value={goal.progress || 0} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <span className="material-icons text-sm mr-1">add</span>
                  Add New Goal
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Focus Game Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-outfit font-semibold">Brain Break</h2>
              <span className="text-sm text-gray-500">Take a quick coding break</span>
            </div>
            <CodeBreakGame />
          </div>

          {/* Code Playground Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-outfit font-semibold">Code Playground</h2>
              <Button variant="link" className="text-primary" asChild>
                <Link href="/code-challenges">View All Challenges</Link>
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Practice Your Coding Skills</CardTitle>
                <CardDescription>
                  Solve coding challenges and test your solutions against test cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p>Improve your programming skills with our interactive code playground. Solve challenges, run tests, and get instant feedback.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/10 p-4 rounded-lg flex flex-col items-center text-center">
                      <div className="rounded-full bg-primary/20 p-3 mb-2">
                        <span className="material-icons text-primary">code</span>
                      </div>
                      <h3 className="font-medium">Write Code</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use our code editor with syntax highlighting</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg flex flex-col items-center text-center">
                      <div className="rounded-full bg-primary/20 p-3 mb-2">
                        <span className="material-icons text-primary">play_arrow</span>
                      </div>
                      <h3 className="font-medium">Run Tests</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Test your code against our test cases</p>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-lg flex flex-col items-center text-center">
                      <div className="rounded-full bg-primary/20 p-3 mb-2">
                        <span className="material-icons text-primary">leaderboard</span>
                      </div>
                      <h3 className="font-medium">Track Progress</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">See your improvement over time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/code-challenges">Start Coding</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quizzes Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-outfit font-semibold">Your Quizzes</h2>
              <Button variant="link" className="text-primary">See All Quizzes</Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Recent Quiz Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Recent Results</CardTitle>
                    <CardDescription>
                      See how you've performed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadingProgress ? (
                        Array(3).fill(0).map((_, index) => (
                          <Skeleton key={index} className="h-16 w-full" />
                        ))
                      ) : mergedQuizData?.quizResults && mergedQuizData.quizResults.length > 0 ?
                        mergedQuizData.quizResults.slice(0, 3).map((quiz: any) => (
                          <div key={quiz.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{quiz.title}</span>
                              <Badge className={`${
                                quiz.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                quiz.score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {quiz.score}% {quiz.passed ? '(Passed)' : '(Failed)'}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{new Date(quiz.timestamp).toLocaleDateString()} • {Math.round(quiz.score / 100 * quiz.totalQuestions)}/{quiz.totalQuestions} questions</span>
                              {quiz.timeTaken && <span>{formatTimeTaken(quiz.timeTaken)}</span>}
                              {quiz.fromLocalStorage && <span className="italic">(locally saved)</span>}
                            </div>
                          </div>
                        ))
                       :
                        // No quiz results for new users
                        <div className="text-center py-6">
                          <p className="text-gray-500 dark:text-gray-400">You haven't completed any quizzes yet.</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Start a quiz to track your progress!</p>
                        </div>
                      }
                    </div>
                  </CardContent>
                </Card>

                {/* Available Quizzes */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Available Quizzes</CardTitle>
                    <CardDescription>
                      Practice your skills with these quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadingCourses ? (
                        Array(3).fill(0).map((_, index) => (
                          <Skeleton key={index} className="h-16 w-full" />
                        ))
                      ) : (
                        courses && Array.isArray(courses) && courses.slice(0, 3).map((course: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{course.title} Quiz</p>
                              <p className="text-xs text-gray-500">Test your knowledge in {course.level} concepts</p>
                            </div>
                            <Link to={`/quiz/${course.id}`}>
                              <Button size="sm" variant="outline">Take Quiz</Button>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Summary */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Quiz Performance Summary</CardTitle>
                  <CardDescription>
                    Your progress across all quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <h3 className="text-2xl font-bold text-primary">
                          {mergedQuizData?.stats?.quizzesPassed || 0}
                        </h3>
                        <p className="text-sm">Quizzes Passed</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <h3 className="text-2xl font-bold text-primary">
                          {mergedQuizData?.stats?.averageScore || "0%"}
                        </h3>
                        <p className="text-sm">Average Score</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <h3 className="text-2xl font-bold text-primary">
                          {mergedQuizData?.stats?.quizzesAttempted || 0}
                        </h3>
                        <p className="text-sm">Quizzes Attempted</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <h3 className="text-2xl font-bold text-primary">
                          {mergedQuizData?.stats?.totalQuizzes || 0}
                        </h3>
                        <p className="text-sm">Available Quizzes</p>
                      </div>
                    </div>

                    {/* Quiz Score Trend Chart */}
                    {mergedQuizData?.quizResults && mergedQuizData.quizResults.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-3">Score Trend</h3>
                        <QuizScoreChart quizResults={mergedQuizData.quizResults} />
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                          <span>Reference line: 70% passing score</span>
                          <span>{mergedQuizData.quizResults.length} quiz results</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mood & Progress Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>
                  Your learning and wellness activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {loadingProgress ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={progressData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                        <Tooltip formatter={(value) => [`${value} mins`, undefined]} />
                      <Legend />
                      <Bar dataKey="study" name="Study Time (min)" fill="#7C9EC2" />
                        <Bar dataKey="mental" name="Mental Health (min)" fill="#A8D5BA" />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
                <div className="flex justify-center mt-4 text-xs text-gray-500">
                  <p className="px-2">Study activities include: courses, quizzes, and more</p>
                  <p className="px-2">Mental activities include: journal entries, breathing exercises</p>
                </div>
              </CardContent>
            </Card>

            {/* Mood Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Mood Tracking</CardTitle>
                <CardDescription>
                  Your emotional wellbeing while learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Link href="/mental-health/journal">
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <span className="material-icons text-sm mr-1">add</span>
                  Log Today's Mood
                </Button>
                </Link>
                <div className="flex w-full mt-2 gap-2">
                  <Link href="/mental-health/journal" className="flex-1">
                    <Button variant="outline" className="w-full bg-background/70 hover:bg-background/90">
                      <span className="material-icons text-sm mr-1">history</span>
                      View History
                    </Button>
                  </Link>
                  <Link href="/mental-health/breathing" className="flex-1">
                    <Button variant="outline" className="w-full bg-background/70 hover:bg-background/90">
                      <span className="material-icons text-sm mr-1">air</span>
                      Breathing
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Upcoming Sessions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Scheduled lessons and study groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-primary/20 rounded-full p-2 mr-3">
                        <span className="material-icons text-primary">event</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-gray-500">{session.date} at {session.time}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Calendar</Button>
            </CardFooter>
          </Card>

          {/* Recent Activity */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent progress and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loadingProgress ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : userProgressData?.recentActivity && userProgressData.recentActivity.length > 0 ? (
                  userProgressData.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-2 rounded-full mr-3 ${
                        getActivityIconClass(activity.type)
                      }`}>
                        <span className="material-icons text-primary">
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6">
                    <p>No recent activity yet.</p>
                    <p className="text-sm text-gray-500 mt-1">Start learning to see your activity here!</p>
                    <Button className="mt-4" size="sm" onClick={() => location.href = "/courses"}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            {userProgressData?.recentActivity && userProgressData.recentActivity.length > 5 && (
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full">
                  View More Activity
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Recommended Courses */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-outfit font-semibold">Recommended for You</h2>
              <Button variant="link" className="text-primary">View All</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loadingCourses ? (
                Array(3).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))
              ) : (
                courses && Array.isArray(courses) && courses.map((course: any) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description || ""}
                    imageUrl={course.imageUrl}
                    category={course.category}
                    level={course.level}
                    duration={course.duration}
                    lessonCount={course.lectureCount}
                    progress={course.progress || 0}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Helper functions for activity display
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'lesson': return 'book';
    case 'quiz': return 'quiz';
    case 'mood': return 'mood';
    case 'breathing': return 'air';
    case 'timeSpent': return 'timer';
    default: return 'stars';
  }
};

const getActivityIconClass = (type: string) => {
  switch (type) {
    case 'lesson': return 'bg-blue-100 dark:bg-blue-900/30';
    case 'quiz': return 'bg-green-100 dark:bg-green-900/30';
    case 'mood': return 'bg-purple-100 dark:bg-purple-900/30';
    case 'breathing': return 'bg-cyan-100 dark:bg-cyan-900/30';
    case 'timeSpent': return 'bg-amber-100 dark:bg-amber-900/30';
    default: return 'bg-gray-100 dark:bg-gray-700';
  }
};

const formatActivityTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default Dashboard;