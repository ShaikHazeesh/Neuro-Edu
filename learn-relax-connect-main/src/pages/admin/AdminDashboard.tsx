
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Clock, Users, PlayCircle, PlusCircle, ArrowRight, Video } from 'lucide-react';

const AdminDashboard = () => {
  const { videos, progress, meditations, games } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock student data
  const students = [
    { id: 'student-1', name: 'John Doe', email: 'student@example.com', lastActive: new Date().toISOString(), videosCompleted: 2 },
    { id: 'student-2', name: 'Jane Smith', email: 'jane@example.com', lastActive: new Date(Date.now() - 86400000).toISOString(), videosCompleted: 5 },
    { id: 'student-3', name: 'Bob Johnson', email: 'bob@example.com', lastActive: new Date(Date.now() - 172800000).toISOString(), videosCompleted: 3 }
  ];
  
  // Calculate stats
  const totalVideos = videos.length;
  const totalMeditations = meditations.length;
  const totalGames = games.length;
  const totalStudents = students.length;
  
  // Chart data
  const categoryData = videos.reduce((acc, video) => {
    const category = video.category;
    const existingCategory = acc.find(item => item.name === category);
    
    if (existingCategory) {
      existingCategory.count += 1;
    } else {
      acc.push({ name: category, count: 1 });
    }
    
    return acc;
  }, [] as { name: string; count: number }[]);
  
  const videoCompletionData = videos.map(video => {
    const completions = progress.filter(p => p.videoId === video.id && p.completed).length;
    const views = progress.filter(p => p.videoId === video.id).length;
    
    return {
      name: video.title.length > 20 ? video.title.substring(0, 20) + '...' : video.title,
      views,
      completions
    };
  });
  
  // Colors for charts
  const COLORS = ['#86B6F6', '#B4D4FF', '#A1CCA5', '#E5DEFF', '#FFE2E2'];
  
  return (
    <div className="container mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 max-w-2xl">
          Manage educational content and monitor student progress in the wellness education portal.
        </p>
      </header>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Videos</p>
                <h3 className="text-3xl font-bold">{totalVideos}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-wellness-blue/10 flex items-center justify-center text-wellness-blue">
                <Video className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0">
            <Link to="/admin/videos" className="px-6 py-3 text-sm text-wellness-blue hover:text-wellness-blue/80 border-t w-full flex items-center justify-between">
              <span>View all videos</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>
                <h3 className="text-3xl font-bold">{totalStudents}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-wellness-sage/10 flex items-center justify-center text-wellness-sage">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0">
            <Link to="/admin/students" className="px-6 py-3 text-sm text-wellness-sage hover:text-wellness-sage/80 border-t w-full flex items-center justify-between">
              <span>View all students</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Meditations</p>
                <h3 className="text-3xl font-bold">{totalMeditations}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-wellness-lavender/30 flex items-center justify-center text-indigo-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0">
            <Link to="/admin/meditations" className="px-6 py-3 text-sm text-indigo-600 hover:text-indigo-500 border-t w-full flex items-center justify-between">
              <span>Manage meditations</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Games</p>
                <h3 className="text-3xl font-bold">{totalGames}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-wellness-blush/30 flex items-center justify-center text-rose-500">
                <PlayCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0">
            <Link to="/admin/games" className="px-6 py-3 text-sm text-rose-500 hover:text-rose-400 border-t w-full flex items-center justify-between">
              <span>Manage games</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>
        
        {/* Overview tab */}
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Video Views & Completions</CardTitle>
                <CardDescription>Track how students are engaging with videos</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={videoCompletionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" name="Total Views" fill="#86B6F6" />
                      <Bar dataKey="completions" name="Completions" fill="#A1CCA5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Videos by Category</CardTitle>
                <CardDescription>Distribution of videos across categories</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} videos`, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Videos tab */}
        <TabsContent value="videos" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Videos</h2>
            <Button asChild className="bg-wellness-blue hover:bg-wellness-blue/90">
              <Link to="/admin/videos/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Video
              </Link>
            </Button>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Title</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Duration</th>
                    <th className="text-left p-4">Views</th>
                    <th className="text-left p-4">Completions</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.slice(0, 5).map((video) => {
                    const views = progress.filter(p => p.videoId === video.id).length;
                    const completions = progress.filter(p => p.videoId === video.id && p.completed).length;
                    
                    return (
                      <tr key={video.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="h-10 w-16 rounded overflow-hidden mr-3">
                              <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                            </div>
                            <span className="font-medium">{video.title}</span>
                          </div>
                        </td>
                        <td className="p-4">{video.category}</td>
                        <td className="p-4">{Math.floor(video.duration / 60)} min</td>
                        <td className="p-4">{views}</td>
                        <td className="p-4">{completions}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/videos/${video.id}`}>View</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/videos/edit/${video.id}`}>Edit</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {videos.length > 5 && (
              <div className="p-4 border-t text-center">
                <Button variant="ghost" asChild>
                  <Link to="/admin/videos">View All Videos</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Students tab */}
        <TabsContent value="students" className="mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Student Activity</h2>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Last Active</th>
                    <th className="text-left p-4">Videos Completed</th>
                    <th className="text-left p-4">Progress</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const lastActive = new Date(student.lastActive);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
                    const progressPercent = (student.videosCompleted / totalVideos) * 100;
                    
                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-wellness-light-blue mr-3 flex items-center justify-center text-wellness-blue font-medium">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{student.email}</td>
                        <td className="p-4">
                          {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`}
                        </td>
                        <td className="p-4">{student.videosCompleted}/{totalVideos}</td>
                        <td className="p-4">
                          <div className="w-full bg-wellness-light-blue/30 rounded-full h-2.5">
                            <div 
                              className="bg-wellness-blue h-2.5 rounded-full" 
                              style={{width: `${progressPercent}%`}}
                            ></div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">View Details</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
