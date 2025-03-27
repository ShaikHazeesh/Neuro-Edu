import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import VideoSection from "@/components/sections/VideoSection";
import { Skeleton } from "@/components/ui/skeleton";

const CourseDetail = () => {
  const [match, params] = useRoute("/courses/:id");
  const courseId = match ? parseInt(params.id) : null;

  const { data: course, isLoading, error } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
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
              <Link href="/">
                <a className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent">
                  Home
                </a>
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/courses">
                  <a className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-accent">
                    Courses
                  </a>
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
            <Link href="/courses">
              <a className="bg-primary text-white px-4 py-2 rounded-standard">
                Return to Courses
              </a>
            </Link>
          </div>
        ) : (
          <>
            <VideoSection />
            
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
