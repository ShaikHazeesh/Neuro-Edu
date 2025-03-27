import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import CourseCard from "@/components/shared/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const categories = [
  "All Courses",
  "Web Development",
  "Python",
  "JavaScript",
  "Data Science",
  "Mobile Apps"
];

const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const Courses = () => {
  const [activeCategory, setActiveCategory] = useState("All Courses");
  const [activeLevel, setActiveLevel] = useState("All Levels");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger a filtered API request
    console.log("Searching for:", searchQuery);
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-darkBg py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4 text-center">
            Programming Courses
          </h1>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-center text-gray-600 dark:text-gray-300">
            Learn at your own pace with our structured programming courses designed for mental wellness.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for courses..." 
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-icons absolute left-4 top-3 text-gray-400">search</span>
              <button 
                type="submit" 
                className="absolute right-2 top-2 bg-primary hover:bg-opacity-90 text-white p-2 rounded-full"
              >
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          </form>
          
          <div className="flex flex-col gap-6 md:flex-row md:gap-12">
            {/* Filters for desktop */}
            <div className="hidden md:block w-64 bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft h-fit">
              <h3 className="font-outfit font-semibold mb-4">Categories</h3>
              <div className="space-y-2 mb-6">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === category
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <h3 className="font-outfit font-semibold mb-4">Difficulty Level</h3>
              <div className="space-y-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeLevel === level
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filters for mobile */}
            <div className="md:hidden mb-6 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-2 min-w-max pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-2 min-w-max pb-2 mt-3">
                {levels.map((level) => (
                  <button
                    key={level}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      activeLevel === level
                        ? 'bg-secondary text-white'
                        : 'bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-grow">
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {isLoading ? (
                  // Loading skeletons
                  Array(6).fill(0).map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-standard overflow-hidden shadow-soft">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-5">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <Skeleton className="h-2 w-full mb-1" />
                        <Skeleton className="h-2 w-1/4 mb-4 ml-auto" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  ))
                ) : (
                  courses?.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  )) || (
                    <div className="col-span-full text-center py-10">
                      <p className="text-gray-500 dark:text-gray-400">No courses available at the moment</p>
                    </div>
                  )
                )}
              </motion.div>
              
              {/* Pagination */}
              {!isLoading && courses && courses.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <nav aria-label="Pagination" className="flex items-center space-x-2">
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" disabled>
                      <span className="material-icons">chevron_left</span>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">1</button>
                    <button className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">2</button>
                    <button className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">3</button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="material-icons">chevron_right</span>
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Courses;
