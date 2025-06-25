
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const circlePath = `M 50,50 m -40,0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-wellness-cream to-wellness-light-blue/30 p-4">
      <motion.div 
        className="text-center max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-wellness-blue/10 text-wellness-blue mb-6 relative"
          variants={itemVariants}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" className="absolute">
            <motion.path
              d={circlePath}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
          <span className="text-5xl font-bold">404</span>
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-wellness-blue to-wellness-blue/70"
          variants={itemVariants}
        >
          Page Not Found
        </motion.h1>
        
        <motion.p 
          className="text-gray-600 mb-8"
          variants={itemVariants}
        >
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </motion.p>
        
        <motion.div className="flex flex-col sm:flex-row gap-3 justify-center" variants={itemVariants}>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to={-1 as any} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </Link>
          </Button>
          
          <Button asChild className="bg-wellness-blue hover:bg-wellness-blue/90">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Return to Home</span>
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
