import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import CheatSheetCard from "@/components/shared/CheatSheetCard";
import { Skeleton } from "@/components/ui/skeleton";

const CheatSheets = () => {
  const { data: cheatSheets, isLoading } = useQuery({
    queryKey: ['/api/cheatsheets'],
  });

  return (
    <section className="py-16 px-4 bg-background dark:bg-darkBg transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-2">Quick Reference Guides</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-xl">Easily accessible cheat sheets to help reinforce key concepts.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/cheat-sheets" className="px-4 py-2 border border-primary dark:border-accent text-primary dark:text-accent rounded-standard text-sm font-medium hover:bg-primary/5 dark:hover:bg-accent/10 transition-colors inline-block">
              View All Guides
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
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
            cheatSheets?.map((cheatSheet) => (
              <CheatSheetCard key={cheatSheet.id} cheatSheet={cheatSheet} />
            )) || (
              <>
                {/* Default cheat sheets if no data */}
                <motion.div 
                  className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden hover:transform hover:scale-[1.01] hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
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
                </motion.div>
                
                <motion.div 
                  className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden hover:transform hover:scale-[1.01] hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
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
                </motion.div>
                
                <motion.div 
                  className="bg-white dark:bg-gray-800 rounded-standard shadow-soft overflow-hidden hover:transform hover:scale-[1.01] hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
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
                </motion.div>
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
};

export default CheatSheets;
