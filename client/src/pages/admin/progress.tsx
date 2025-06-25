import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import {
  BarChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

const ProgressTracking = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<string>("overview");

  // Fetch all progress data
  const { data: progressData, isLoading: loadingProgress } = useQuery<any>({
    queryKey: ['/api/admin/progress'],
  });

  // Mock data for charts
  const courseProgressData = [
    { name: 'Web Dev', completed: 68, inProgress: 32 },
    { name: 'Python', completed: 45, inProgress: 55 },
    { name: 'JavaScript', completed: 52, inProgress: 48 },
    { name: 'Data Science', completed: 38, inProgress: 62 },
    { name: 'Machine Learning', completed: 25, inProgress: 75 },
  ];

  const quizPerformanceData = [
    { name: 'Quiz 1', avgScore: 78, passRate: 85 },
    { name: 'Quiz 2', avgScore: 82, passRate: 90 },
    { name: 'Quiz 3', avgScore: 75, passRate: 78 },
    { name: 'Quiz 4', avgScore: 88, passRate: 92 },
    { name: 'Quiz 5', avgScore: 79, passRate: 83 },
  ];

  const videoCompletionData = [
    { name: 'Video 1', completionRate: 92 },
    { name: 'Video 2', completionRate: 85 },
    { name: 'Video 3', completionRate: 78 },
    { name: 'Video 4', completionRate: 65 },
    { name: 'Video 5', completionRate: 72 },
  ];

  const playgroundUsageData = [
    { name: 'Challenge 1', completionRate: 75, avgAttempts: 3.2 },
    { name: 'Challenge 2', completionRate: 68, avgAttempts: 4.5 },
    { name: 'Challenge 3', completionRate: 52, avgAttempts: 5.8 },
    { name: 'Challenge 4', completionRate: 45, avgAttempts: 6.2 },
    { name: 'Challenge 5', completionRate: 38, avgAttempts: 7.1 },
  ];

  // Mock data for student progress list
  const studentProgressList = [
    { id: 1, name: 'John Doe', quizzesPassed: 8, videosWatched: 15, playgroundChallenges: 6, overallProgress: 75 },
    { id: 2, name: 'Jane Smith', quizzesPassed: 12, videosWatched: 22, playgroundChallenges: 9, overallProgress: 92 },
    { id: 3, name: 'Bob Johnson', quizzesPassed: 5, videosWatched: 10, playgroundChallenges: 3, overallProgress: 45 },
    { id: 4, name: 'Alice Brown', quizzesPassed: 10, videosWatched: 18, playgroundChallenges: 7, overallProgress: 88 },
    { id: 5, name: 'Charlie Wilson', quizzesPassed: 7, videosWatched: 12, playgroundChallenges: 5, overallProgress: 62 },
  ];

  // Filter students based on search query
  const filteredStudents = studentProgressList.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
            <p className="text-muted-foreground">
              Monitor student progress across different learning activities
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={() => navigate("/admin/students")}>
              <span className="material-icons text-sm mr-2">people</span>
              View Students
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Course Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingProgress ? <Skeleton className="h-8 w-16" /> : "68%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +5% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Quiz Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingProgress ? <Skeleton className="h-8 w-16" /> : "76%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +2% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Video Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingProgress ? <Skeleton className="h-8 w-16" /> : "82%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +8% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Playground Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingProgress ? <Skeleton className="h-8 w-16" /> : "56%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress Overview</CardTitle>
                <CardDescription>
                  Completion rates by course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={courseProgressData}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed (%)" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="inProgress" name="In Progress (%)" stackId="a" fill="#93c5fd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Progress</CardTitle>
                <CardDescription>
                  Individual student progress across all activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Student</th>
                        <th className="text-left py-3 px-4">Quizzes Passed</th>
                        <th className="text-left py-3 px-4">Videos Watched</th>
                        <th className="text-left py-3 px-4">Playground Challenges</th>
                        <th className="text-left py-3 px-4">Overall Progress</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingProgress ? (
                        Array(5).fill(0).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-8 w-20" /></td>
                          </tr>
                        ))
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="py-3 px-4">{student.quizzesPassed}</td>
                            <td className="py-3 px-4">{student.videosWatched}</td>
                            <td className="py-3 px-4">{student.playgroundChallenges}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-primary h-2.5 rounded-full"
                                    style={{ width: `${student.overallProgress}%` }}
                                  ></div>
                                </div>
                                <span>{student.overallProgress}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/students/${student.id}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>
                  Average scores and pass rates by quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quizPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        name="Average Score (%)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="passRate"
                        name="Pass Rate (%)"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-6">
                  <h3 className="text-lg font-medium">Quiz Details</h3>
                  {quizPerformanceData.map((quiz, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{quiz.name}</h4>
                        <div className="flex space-x-4">
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                            Avg: {quiz.avgScore}%
                          </span>
                          <span className="text-sm px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                            Pass: {quiz.passRate}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-blue-500 h-2.5 rounded-full"
                              style={{ width: `${quiz.avgScore}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Pass Rate</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-green-500 h-2.5 rounded-full"
                              style={{ width: `${quiz.passRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card>
              <CardHeader>
                <CardTitle>Video Lecture Completion</CardTitle>
                <CardDescription>
                  Completion rates by video lecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={videoCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="completionRate"
                        name="Completion Rate (%)"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-6">
                  <h3 className="text-lg font-medium">Video Details</h3>
                  {videoCompletionData.map((video, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{video.name}</h4>
                        <span className="text-sm px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                          {video.completionRate}% Completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                        <div
                          className="bg-purple-500 h-2.5 rounded-full"
                          style={{ width: `${video.completionRate}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-medium">{Math.floor(Math.random() * 50) + 30}</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Avg. Watch Time</p>
                          <p className="font-medium">{Math.floor(Math.random() * 10) + 5} min</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Completion</p>
                          <p className="font-medium">{video.completionRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playground Tab */}
          <TabsContent value="playground">
            <Card>
              <CardHeader>
                <CardTitle>Code Playground Usage</CardTitle>
                <CardDescription>
                  Completion rates and average attempts by challenge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={playgroundUsageData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="completionRate"
                        name="Completion Rate (%)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgAttempts"
                        name="Avg. Attempts"
                        stroke="#f59e0b"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 space-y-6">
                  <h3 className="text-lg font-medium">Challenge Details</h3>
                  {playgroundUsageData.map((challenge, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{challenge.name}</h4>
                        <div className="flex space-x-4">
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                            {challenge.completionRate}% Completed
                          </span>
                          <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">
                            {challenge.avgAttempts} Attempts
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-blue-500 h-2.5 rounded-full"
                              style={{ width: `${challenge.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Difficulty (based on attempts)</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-amber-500 h-2.5 rounded-full"
                              style={{ width: `${(challenge.avgAttempts / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ProgressTracking;
