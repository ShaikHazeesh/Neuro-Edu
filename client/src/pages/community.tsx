import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Community = () => {
  const [activeTab, setActiveTab] = useState("discussions");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const { data: forumPosts, isLoading } = useQuery({
    queryKey: ['/api/forum'],
  });
  
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const categories = [
    "All",
    "Mental Health",
    "Beginners",
    "JavaScript",
    "Python",
    "Web Development",
    "Algorithms",
    "Career Advice"
  ];
  
  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-darkBg py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4">Community Forum</h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Connect with peers who understand both the challenges of learning to code and managing mental health.
            </p>
          </motion.div>
          
          <Tabs defaultValue="discussions" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-8">
              <TabsTrigger value="discussions">Discussions</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="studyGroups">Study Groups</TabsTrigger>
            </TabsList>
            
            <TabsContent value="discussions">
              <div className="flex flex-wrap items-center justify-between mb-6">
                <div className="overflow-x-auto hide-scrollbar w-full md:w-auto mb-4 md:mb-0">
                  <div className="flex space-x-2 min-w-max pb-2">
                    {categories.map((category, index) => (
                      <motion.button
                        key={category}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        {category}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <Button className="bg-primary hover:bg-opacity-90 text-white hidden md:flex">
                  <span className="material-icons mr-2 text-sm">add</span>
                  New Post
                </Button>
              </div>
              
              <div className="mb-6 md:hidden">
                <Button className="w-full bg-primary hover:bg-opacity-90 text-white">
                  <span className="material-icons mr-2 text-sm">add</span>
                  New Post
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons
                  Array(5).fill(0).map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-standard shadow-soft">
                      <div className="flex items-start">
                        <Skeleton className="h-10 w-10 rounded-full mr-3" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <div className="flex space-x-2 mb-3">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <div className="flex justify-between">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  forumPosts?.map((post) => (
                    <motion.div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded-standard shadow-soft hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-start">
                        <div className="hidden md:block">
                          {post.userAvatar ? (
                            <img
                              src={post.userAvatar}
                              alt={post.username}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full mr-3 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="material-icons text-gray-500 dark:text-gray-400">person</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-outfit font-semibold text-lg mb-1">{post.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags?.map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <span className="material-icons text-sm mr-1">person</span>
                              <span>{post.username}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="material-icons text-sm mr-1">thumb_up</span>
                              <span>{post.likes}</span>
                              <span className="mx-2">•</span>
                              <span className="material-icons text-sm mr-1">comment</span>
                              <span>12</span> {/* This would normally come from the API */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) || (
                    // Default content if no posts
                    <>
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-standard shadow-soft text-center">
                        <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="material-icons text-primary text-2xl">forum</span>
                        </div>
                        <h3 className="text-xl font-outfit font-semibold mb-2">No discussions yet</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          Be the first to start a discussion in the community!
                        </p>
                        <Button className="bg-primary hover:bg-opacity-90 text-white">
                          <span className="material-icons mr-2 text-sm">add</span>
                          Create New Post
                        </Button>
                      </div>
                    </>
                  )
                )}
              </div>
              
              {!isLoading && forumPosts && forumPosts.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" className="mr-2">
                    <span className="material-icons text-sm mr-1">chevron_left</span>
                    Previous
                  </Button>
                  <Button variant="outline">
                    Next
                    <span className="material-icons text-sm ml-1">chevron_right</span>
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="support">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 rounded-standard">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
                      <span className="material-icons text-secondary">psychology</span>
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">Mental Health Support</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        A safe space to discuss mental health challenges while learning to code
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-secondary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="material-icons text-primary">self_improvement</span>
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">Mindfulness for Coders</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Techniques to stay present and focused during programming sessions
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                      <span className="material-icons text-accent">diversity_1</span>
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">Imposter Syndrome Support</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Connect with others experiencing self-doubt in their coding journey
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-accent hover:bg-opacity-90 text-darkBg">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mr-3">
                      <span className="material-icons text-red-500">favorite</span>
                    </div>
                    <div>
                      <h3 className="font-outfit font-semibold text-lg">Burnout Prevention</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Strategies to recognize and prevent programmer burnout
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Join Group</Button>
                </Card>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft mb-8">
                <h3 className="font-outfit font-semibold text-xl mb-4">Weekly Support Sessions</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div>
                      <h4 className="font-medium">Mindfulness Monday</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Every Monday at 7:00 PM EST</p>
                    </div>
                    <Button variant="outline">Join</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div>
                      <h4 className="font-medium">Wellness Wednesday</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Every Wednesday at 6:30 PM EST</p>
                    </div>
                    <Button variant="outline">Join</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div>
                      <h4 className="font-medium">Feedback Friday</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Every Friday at 5:00 PM EST</p>
                    </div>
                    <Button variant="outline">Join</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="studyGroups">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 rounded-standard">
                  <div className="mb-4">
                    <h3 className="font-outfit font-semibold text-lg mb-1">Python Study Group</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Weekly sessions focused on Python fundamentals with mental health check-ins
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs">
                        Python
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary text-xs">
                        Beginners
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1">group</span>
                      <span>12 members</span>
                    </div>
                    <div>
                      <span>Thursdays 7:00 PM</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="mb-4">
                    <h3 className="font-outfit font-semibold text-lg mb-1">JavaScript Deep Dive</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Advanced JavaScript concepts with a supportive, stress-free approach
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs">
                        JavaScript
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary text-xs">
                        Intermediate
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1">group</span>
                      <span>8 members</span>
                    </div>
                    <div>
                      <span>Tuesdays 6:30 PM</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="mb-4">
                    <h3 className="font-outfit font-semibold text-lg mb-1">Web Development Basics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      HTML, CSS and JavaScript fundamentals with focus on mindful learning
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs">
                        Web Dev
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary text-xs">
                        Beginners
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1">group</span>
                      <span>15 members</span>
                    </div>
                    <div>
                      <span>Mondays 7:30 PM</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="mb-4">
                    <h3 className="font-outfit font-semibold text-lg mb-1">Algorithm Practice</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Weekly algorithm challenges in a low-pressure, supportive environment
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs">
                        Algorithms
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary text-xs">
                        All Levels
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1">group</span>
                      <span>10 members</span>
                    </div>
                    <div>
                      <span>Wednesdays 8:00 PM</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard">
                  <div className="mb-4">
                    <h3 className="font-outfit font-semibold text-lg mb-1">React Study Circle</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Building React applications with regular mental wellness breaks
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs">
                        React
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary text-xs">
                        Intermediate
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1">group</span>
                      <span>9 members</span>
                    </div>
                    <div>
                      <span>Fridays 6:00 PM</span>
                    </div>
                  </div>
                  <Button className="w-full bg-primary hover:bg-opacity-90 text-white">Join Group</Button>
                </Card>
                
                <Card className="p-6 rounded-standard border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <span className="material-icons text-gray-500 dark:text-gray-400">add</span>
                  </div>
                  <h3 className="font-outfit font-semibold text-lg mb-2">Create a Study Group</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                    Start your own study group focused on a specific topic
                  </p>
                  <Button variant="outline">Create Group</Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Community;
