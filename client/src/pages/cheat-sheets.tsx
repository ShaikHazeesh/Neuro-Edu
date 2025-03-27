import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import CheatSheetCard from "@/components/shared/CheatSheetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const categories = ["All Topics", "Python", "JavaScript", "Web Development", "Data Science", "Algorithms"];
const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const CheatSheetsPage = () => {
  const { data: cheatSheets, isLoading, error } = useQuery({
    queryKey: ['/api/cheatsheets'],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-primary/10 to-background dark:from-primary/20 dark:to-darkBg py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-4">
              Quick Reference Guides
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Access cheat sheets and reference materials to reinforce concepts and solve problems quickly.
            </p>
          </motion.div>

          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  index === 0 
                    ? 'bg-primary text-white' 
                    : 'bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700'
                } transition-colors`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                {category}
              </motion.button>
            ))}
          </div>

          <div className="mb-12 flex flex-wrap justify-center gap-3">
            {levels.map((level, index) => (
              <motion.button
                key={level}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  index === 0 
                    ? 'bg-secondary text-white' 
                    : 'bg-white dark:bg-gray-800 text-textColor dark:text-darkText hover:bg-gray-100 dark:hover:bg-gray-700'
                } transition-colors`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
              >
                {level}
              </motion.button>
            ))}
          </div>

          {error ? (
            <div className="text-center py-10">
              <p className="text-red-500 mb-2">Failed to load cheat sheets</p>
              <p className="text-gray-600 dark:text-gray-300">Please try again later</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {isLoading ? (
                // Loading skeletons
                Array(6).fill(0).map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-6 w-full" />
                        ))}
                      </div>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))
              ) : (
                Array.isArray(cheatSheets) && cheatSheets.map((cheatSheet) => (
                  <CheatSheetCard key={cheatSheet.id} cheatSheet={cheatSheet} />
                )) || (
                  // Default cheat sheets if no data
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">Python Basics</h3>
                          <div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs px-2 py-1 rounded-full">
                            Beginner
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Variables & Data Types
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Control Flow (if/else)
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Loops (for, while)
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Functions & Parameters
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Lists & Dictionaries
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">JavaScript Essentials</h3>
                          <div className="bg-secondary/10 dark:bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full">
                            Intermediate
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            ES6 Syntax
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            Arrow Functions
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            Promises & Async/Await
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            Array Methods
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            DOM Manipulation
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">CSS Grid & Flexbox</h3>
                          <div className="bg-accent/10 dark:bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
                            All Levels
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Flexbox Container Properties
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Flexbox Item Properties
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Grid Container Setup
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Grid Placement
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Responsive Layouts
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">React Hooks</h3>
                          <div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-xs px-2 py-1 rounded-full">
                            Intermediate
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            useState
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            useEffect
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            useContext
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            useRef
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-primary text-sm mr-2">check_circle</span>
                            Custom Hooks
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">SQL Basics</h3>
                          <div className="bg-secondary/10 dark:bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full">
                            Beginner
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            SELECT Statements
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            WHERE Clauses
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            JOINs
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            GROUP BY
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-secondary text-sm mr-2">check_circle</span>
                            Indexes
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden">
                      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="font-outfit font-semibold">Git Commands</h3>
                          <div className="bg-accent/10 dark:bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
                            All Levels
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Basic Git Flow
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Branching & Merging
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Resolving Conflicts
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Stashing Changes
                          </li>
                          <li className="flex items-center">
                            <span className="material-icons text-accent text-sm mr-2">check_circle</span>
                            Advanced Git Features
                          </li>
                        </ul>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
                        <button className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText py-2 rounded-standard font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center">
                          <span className="material-icons text-sm mr-2">download</span> Download PDF
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}
            </motion.div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CheatSheetsPage;
