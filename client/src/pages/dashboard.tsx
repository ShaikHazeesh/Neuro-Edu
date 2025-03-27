import { useState, useEffect, useMemo } from "react";
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
import { BarChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

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

const Dashboard = () => {
  const { user } = useAuth();
  
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
  
  // Generate weekly activity data from real user progress
  const progressData = [
    { name: 'Mon', study: 65, mental: 40 },
    { name: 'Tue', study: 45, mental: 30 },
    { name: 'Wed', study: 90, mental: 60 },
    { name: 'Thu', study: 30, mental: 80 },
    { name: 'Fri', study: 75, mental: 70 },
    { name: 'Sat', study: 60, mental: 50 },
    { name: 'Sun', study: 15, mental: 90 },
  ];
  
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
  
  // Quiz results (mock data for now, will be replaced with real data)
  const quizResults = [
    { id: 1, title: "Python Basics", score: 85, date: "March 20, 2025", totalQuestions: 20 },
    { id: 2, title: "JavaScript Fundamentals", score: 92, date: "March 15, 2025", totalQuestions: 15 },
    { id: 3, title: "CSS Grid & Flexbox", score: 78, date: "March 10, 2025", totalQuestions: 18 },
  ];
  
  // Upcoming sessions (mocked)
  const upcomingSessions = [
    { id: 1, title: "JavaScript Advanced Concepts", date: "March 28, 2025", time: "15:00" },
    { id: 2, title: "Group Study: Algorithms", date: "March 30, 2025", time: "18:30" },
  ];
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <MainLayout>
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
                <span className="ml-1 font-medium">{userStats.streak} day streak</span>
              </div>
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center">
                <span className="material-icons text-primary">stars</span>
                <span className="ml-1 font-medium">{userStats.points} points</span>
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
                          <Progress value={course.progress || 0} className="h-2" />
                          <div className="flex justify-between text-xs mt-1">
                            <span>{course.progress || 0}% complete</span>
                            <span>{course.lectureCount} lectures</span>
                          </div>
                        </div>
                        <Button className="w-full mt-2 bg-primary hover:bg-primary/90">Continue Course</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Courses</Button>
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
                  {learningGoals.map(goal => (
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
                      {/* First check for actual user quiz results */}
                      {userProgressData?.quizResults && userProgressData.quizResults.length > 0 ? (
                        userProgressData.quizResults.slice(0, 3).map((quiz: any) => (
                          <div key={quiz.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{quiz.title}</span>
                              <Badge className={`${
                                quiz.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                quiz.score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {quiz.score}%
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(quiz.timestamp).toLocaleDateString()} • {Math.round(quiz.score / 100 * quiz.totalQuestions)}/{quiz.totalQuestions} questions
                            </div>
                          </div>
                        ))
                      ) : (
                        // If no quiz results, show mocked data
                        quizResults.map(quiz => (
                          <div key={quiz.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{quiz.title}</span>
                              <Badge className={`${
                                quiz.score >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                quiz.score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {quiz.score}%
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {quiz.date} • {Math.round(quiz.score / 100 * quiz.totalQuestions)}/{quiz.totalQuestions} questions
                            </div>
                          </div>
                        ))
                      )}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <h3 className="text-2xl font-bold text-primary">
                        {userProgressData?.stats?.quizzesPassed || 0}
                      </h3>
                      <p className="text-sm">Quizzes Passed</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <h3 className="text-2xl font-bold text-primary">
                        {userProgressData?.stats?.averageScore || "0%"}
                      </h3>
                      <p className="text-sm">Average Score</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <h3 className="text-2xl font-bold text-primary">
                        {userProgressData?.stats?.totalQuizzes || 0}
                      </h3>
                      <p className="text-sm">Total Quizzes Available</p>
                    </div>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={progressData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="study" name="Study Time (min)" fill="#7C9EC2" />
                      <Bar dataKey="mental" name="Mental Health" fill="#A8D5BA" />
                    </BarChart>
                  </ResponsiveContainer>
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
              <CardFooter>
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <span className="material-icons text-sm mr-1">add</span>
                  Log Today's Mood
                </Button>
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
                  userProgressData.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-2 rounded-full mr-3 ${
                        activity.type === 'lesson' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <span className="material-icons text-primary">
                          {activity.type === 'lesson' ? 'book' : 'quiz'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6">
                    <p>No recent activity yet.</p>
                    <p className="text-sm text-gray-500 mt-1">Start learning to see your activity here!</p>
                  </div>
                )}
              </div>
            </CardContent>
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

export default Dashboard;