import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CourseCard from "@/components/shared/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  "All Courses",
  "Web Development",
  "Python",
  "JavaScript",
  "Data Science",
  "Mobile Apps"
];

const CourseSection = () => {
  const [activeCategory, setActiveCategory] = useState("All Courses");
  
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses'],
  });

  return (
    <section id="courses" className="py-16 px-4 bg-background dark:bg-darkBg transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-2">Programming Courses</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl">
              Build your skills with our carefully structured courses designed for all learning paces.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent w-full md:w-64" 
              />
              <span className="material-icons absolute left-3 top-2 text-gray-400">search</span>
            </div>
          </div>
        </div>
        
        {/* Course Category Tabs */}
        <div className="mb-8 overflow-x-auto hide-scrollbar">
          <div className="flex space-x-2 md:space-x-4 min-w-max pb-2">
            {categories.map((category, index) => (
              <button 
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category 
                    ? "bg-primary text-white" 
                    : "bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
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
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description || ""}
                imageUrl={course.imageUrl}
                category={course.category}
                level={course.level}
                duration={course.duration}
                lessonCount={course.lectureCount || course.lessonCount}
                progress={course.progress || 0}
              />
            )) || (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No courses available at the moment</p>
              </div>
            )
          )}
        </div>
        
        <motion.div 
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/courses" className="px-6 py-3 border border-primary dark:border-accent text-primary dark:text-accent rounded-standard font-medium hover:bg-primary/5 dark:hover:bg-accent/10 transition-colors inline-block">
            View All Courses
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CourseSection;
