import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import VideoSection from "@/components/sections/VideoSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Award, BookOpen, CheckCircle, Lock, Play, CheckSquare, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CourseDetail = () => {
  const [match, params] = useRoute("/courses/:id");
  const courseId = match ? parseInt(params.id) : null;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: course, isLoading, error } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Get course lessons and modules
  const { data: courseLessons, isLoading: isLessonsLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}/lessons`],
    enabled: !!courseId,
  });

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!match) return <div>Course not found</div>;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link to="/courses" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent">
                  Courses
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : course ? (
                    course.title
                  ) : (
                    "Course Details"
                  )}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {error ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Course</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We couldn't load the course details. Please try again later.
            </p>
            <Link to="/courses" className="bg-primary text-white px-4 py-2 rounded-standard inline-block">
              Return to Courses
            </Link>
          </div>
        ) : (
          <>
            <VideoSection />

            {/* Course Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="progress" disabled={!user}>Progress</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : course ? (
                        <div className="space-y-4">
                          <p className="text-gray-700 dark:text-gray-300">{course.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                              <p className="font-medium">{course.level}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                              <p className="font-medium">{course.duration}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Lessons</p>
                              <p className="font-medium">{course.lessonCount || 0}</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                              <p className="font-medium">{course.category}</p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Lessons Tab */}
                <TabsContent value="lessons">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Lessons</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLessonsLoading ? (
                        <div className="space-y-4">
                          {Array(5).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : courseLessons && courseLessons.modules ? (
                        <div className="space-y-6">
                          {courseLessons.modules.map((module, moduleIndex) => (
                            <div key={module.id} className="space-y-2">
                              <h3 className="font-semibold text-lg">{module.title}</h3>
                              <div className="space-y-2">
                                {module.lessons.map((lesson, lessonIndex) => {
                                  // Check if lesson is completed
                                  const isCompleted = course?.completedLessons?.includes(lesson.id);

                                  // Check if lesson is unlocked
                                  // First lesson of each module is unlocked by default
                                  // Other lessons are unlocked if the previous lesson is completed
                                  const isFirstInModule = lessonIndex === 0;
                                  const previousLesson = lessonIndex > 0 ? module.lessons[lessonIndex - 1] : null;
                                  const isPreviousCompleted = previousLesson ? course?.completedLessons?.includes(previousLesson.id) : true;
                                  const isUnlocked = isFirstInModule || isPreviousCompleted;

                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isCompleted ? 'bg-green-500' : isUnlocked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                          {isCompleted ? (
                                            <CheckSquare className="h-4 w-4 text-white" />
                                          ) : isUnlocked ? (
                                            <Play className="h-4 w-4 text-white" />
                                          ) : (
                                            <Lock className="h-4 w-4 text-white" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium">{lesson.title}</p>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.duration}</p>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={isCompleted ? "outline" : "default"}
                                        className={isCompleted ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                                        disabled={!isUnlocked}
                                        onClick={() => window.location.href = `/lessons/${lesson.id}`}
                                      >
                                        {isCompleted ? "Review" : "Start"} <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-gray-500">No lessons available for this course yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Progress Tab */}
                <TabsContent value="progress">
                  {user && course && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <BookOpen className="h-5 w-5 mr-2 text-primary" />
                              <span className="text-sm font-medium">Completed Lessons</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{course.completedLessons || 0}</p>
                          </div>

                          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                              <span className="text-sm font-medium">Quizzes Passed</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{course.quizzesPassed || 0}</p>
                          </div>

                          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Award className="h-5 w-5 mr-2 text-primary" />
                              <span className="text-sm font-medium">Overall Progress</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">{Math.round(course.progress)}%</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Course Completion</span>
                            <span>{Math.round(course.progress || 0)}%</span>
                          </div>
                          <Progress value={Math.min(100, Math.max(0, course.progress || 0))} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Related Courses */}
            <div className="mt-12 mb-8">
              <h2 className="text-2xl font-outfit font-bold mb-6">You Might Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-standard overflow-hidden shadow-sm">
                      <Skeleton className="h-40 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* This would show related courses from the API */}
                    {/* Showing placeholder for now */}
                    <div className="text-center col-span-full py-6">
                      <p className="text-gray-500">Related courses will appear here</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CourseDetail;
