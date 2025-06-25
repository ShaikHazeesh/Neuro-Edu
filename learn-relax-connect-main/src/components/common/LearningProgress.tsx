
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Trophy, Calendar, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface LearningProgressProps {
  videosWatched: number;
  totalVideos: number;
  minutesLearned: number;
  streak: number;
  className?: string;
}

const LearningProgress: React.FC<LearningProgressProps> = ({
  videosWatched,
  totalVideos,
  minutesLearned,
  streak,
  className = ''
}) => {
  const progressPercentage = Math.round((videosWatched / totalVideos) * 100) || 0;
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };
  
  return (
    <Card className={`p-5 ${className}`}>
      <motion.div 
        className="space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex flex-col space-y-1">
          <div className="flex justify-between items-end mb-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Learning Progress</h3>
            <span className="text-xs text-gray-500">{progressPercentage}% complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {videosWatched} of {totalVideos} videos watched
          </p>
        </motion.div>
        
        <motion.div variants={item} className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-wellness-light-blue/30 flex items-center justify-center mb-1">
              <Clock className="h-5 w-5 text-wellness-blue" />
            </div>
            <div className="text-sm font-semibold">{minutesLearned}</div>
            <div className="text-xs text-gray-500">minutes</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-wellness-light-sage/30 flex items-center justify-center mb-1">
              <BookOpen className="h-5 w-5 text-wellness-sage" />
            </div>
            <div className="text-sm font-semibold">{videosWatched}</div>
            <div className="text-xs text-gray-500">videos</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-1">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-sm font-semibold">{streak}</div>
            <div className="text-xs text-gray-500">day streak</div>
          </div>
        </motion.div>
        
        {streak >= 3 && (
          <motion.div
            variants={item}
            className="bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-lg flex items-center gap-3 border border-amber-200"
          >
            <div className="w-8 h-8 rounded-full bg-amber-300/50 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-sm text-amber-800">
              Great work! You're on a {streak} day learning streak!
            </div>
          </motion.div>
        )}
      </motion.div>
    </Card>
  );
};

export default LearningProgress;
