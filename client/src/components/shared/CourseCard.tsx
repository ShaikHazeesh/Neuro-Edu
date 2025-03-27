import { Link } from "wouter";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  imageUrl: string;
  duration: string;
  lectureCount: number;
  progress: number;
}

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const isStarted = course.progress > 0;

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-standard overflow-hidden shadow-soft hover:shadow-md transition-all duration-200"
      whileHover={{ y: -3, scale: 1.01 }}
    >
      <div className="relative">
        <img 
          src={course.imageUrl} 
          alt={`${course.title} Course`} 
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 text-primary dark:text-accent px-2 py-1 rounded-full text-xs font-medium">
          {course.level}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-outfit font-semibold text-lg mb-2">{course.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{course.description}</p>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="material-icons text-sm mr-1">schedule</span> {course.duration}
          <span className="mx-2">•</span>
          <span className="material-icons text-sm mr-1">play_circle</span> {course.lectureCount} lectures
        </div>
        <div className="mb-4">
          <Progress value={course.progress} className="h-2 bg-gray-200 dark:bg-gray-700" />
          <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
            {course.progress}% complete
          </div>
        </div>
        <Link href={`/courses/${course.id}`}>
          <a className={`w-full ${isStarted ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent hover:bg-primary/20 dark:hover:bg-primary/30' : 'bg-primary hover:bg-opacity-90 text-white'} py-2 rounded-standard font-medium text-sm transition-colors block text-center`}>
            {isStarted ? 'Continue Learning' : 'Start Course'}
          </a>
        </Link>
      </div>
    </motion.div>
  );
};

export default CourseCard;
