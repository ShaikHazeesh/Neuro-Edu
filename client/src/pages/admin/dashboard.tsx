import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const [selectedView, setSelectedView] = useState<string>("overview");

  // Fetch all users
  const { data: users, isLoading: loadingUsers } = useQuery<any>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch all progress data
  const { data: progressData, isLoading: loadingProgress } = useQuery<any>({
    queryKey: ['/api/admin/progress'],
  });

  // Fetch all mood data
  const { data: moodData, isLoading: loadingMood } = useQuery<any>({
    queryKey: ['/api/admin/mood'],
  });

  // Mock data for charts
  const userActivityData = [
    { name: 'Mon', active: 45, new: 5 },
    { name: 'Tue', active: 52, new: 8 },
    { name: 'Wed', active: 49, new: 3 },
    { name: 'Thu', active: 63, new: 10 },
    { name: 'Fri', active: 58, new: 7 },
    { name: 'Sat', active: 48, new: 4 },
    { name: 'Sun', active: 38, new: 2 },
  ];

  const courseCompletionData = [
    { name: 'Web Dev', completed: 68, inProgress: 32 },
    { name: 'Python', completed: 45, inProgress: 55 },
    { name: 'JavaScript', completed: 52, inProgress: 48 },
    { name: 'Data Science', completed: 38, inProgress: 62 },
    { name: 'Machine Learning', completed: 25, inProgress: 75 },
  ];

  const moodDistributionData = [
    { name: 'Happy', value: 45, color: '#4CAF50' },
    { name: 'Neutral', value: 30, color: '#2196F3' },
    { name: 'Sad', value: 15, color: '#FFC107' },
    { name: 'Stressed', value: 10, color: '#F44336' },
  ];

  const quizPerformanceData = [
    { name: 'Quiz 1', avgScore: 78 },
    { name: 'Quiz 2', avgScore: 82 },
    { name: 'Quiz 3', avgScore: 75 },
    { name: 'Quiz 4', avgScore: 88 },
    { name: 'Quiz 5', avgScore: 79 },
  ];

  // Mock data for student list
  const studentList = [
    { id: 1, name: 'John Doe', email: 'john@example.com', progress: 75, lastActive: '2023-06-15T10:30:00Z' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', progress: 92, lastActive: '2023-06-15T14:45:00Z' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', progress: 45, lastActive: '2023-06-14T09:15:00Z' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', progress: 88, lastActive: '2023-06-15T11:20:00Z' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', progress: 62, lastActive: '2023-06-13T16:50:00Z' },
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor student progress, activities, and platform usage
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/students")}>
              <span className="material-icons text-sm mr-2">people</span>
              View All Students
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/progress")}>
              <span className="material-icons text-sm mr-2">insights</span>
              Detailed Reports
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingUsers ? <Skeleton className="h-8 w-16" /> : users?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loadingUsers ? <Skeleton className="h-8 w-16" /> : 24}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                48% of total students
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Completion Rate
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
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="mood">Mood Tracking</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Activity</CardTitle>
                  <CardDescription>
                    Daily active students over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userActivityData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="active" name="Active Students" fill="#3b82f6" />
                        <Bar dataKey="new" name="New Students" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Course Completion Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Completion</CardTitle>
                  <CardDescription>
                    Completion rates by course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseCompletionData}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mood Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>
                    Student mood analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={moodDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {moodDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Performance</CardTitle>
                  <CardDescription>
                    Average scores by quiz
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
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Recent Students</CardTitle>
                <CardDescription>
                  List of recently active students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Progress</th>
                        <th className="text-left py-3 px-4">Last Active</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        Array(5).fill(0).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-40" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-8 w-20" /></td>
                          </tr>
                        ))
                      ) : (
                        studentList.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">{student.name}</td>
                            <td className="py-3 px-4">{student.email}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-primary h-2.5 rounded-full"
                                    style={{ width: `${student.progress}%` }}
                                  ></div>
                                </div>
                                <span>{student.progress}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{formatDate(student.lastActive)}</td>
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
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => navigate("/admin/students")}>
                    View All Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>
                  Performance metrics by course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {courseCompletionData.map((course, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{course.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {course.completed}% Completion Rate
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${course.completed}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Enrolled</p>
                          <p className="font-medium">{Math.floor(Math.random() * 100) + 20} students</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Avg. Score</p>
                          <p className="font-medium">{Math.floor(Math.random() * 20) + 70}%</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-muted-foreground">Avg. Time</p>
                          <p className="font-medium">{Math.floor(Math.random() * 5) + 3} hrs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mood Tracking Tab */}
          <TabsContent value="mood">
            <Card>
              <CardHeader>
                <CardTitle>Mood Analytics</CardTitle>
                <CardDescription>
                  Student emotional wellbeing tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Mood Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={moodDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {moodDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-4">Mood Trends</h3>
                    <div className="space-y-4">
                      {moodDistributionData.map((mood, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: mood.color }}
                          ></div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span>{mood.name}</span>
                              <span>{mood.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${mood.value}%`,
                                  backgroundColor: mood.color,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Insights</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="material-icons text-green-500 mr-2">trending_up</span>
                          <span>Happy mood increased by 5% this week</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-red-500 mr-2">trending_down</span>
                          <span>Stressed mood decreased by 3% this week</span>
                        </li>
                        <li className="flex items-start">
                          <span className="material-icons text-yellow-500 mr-2">warning</span>
                          <span>10% of students reported feeling sad for more than 3 days</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={() => navigate("/admin/mood")}>
                    View Detailed Mood Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
