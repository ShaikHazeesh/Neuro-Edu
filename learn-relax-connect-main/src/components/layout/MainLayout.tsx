import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ArrowLeft, User, LogOut, Sun, Moon } from 'lucide-react';
import { toast } from "sonner";
import { AnimatePresence, motion } from 'framer-motion';
import { Loading } from '@/components/ui/loading';
import { ChatbotWidget } from '@/components/ChatbotWidget';

const MainLayout = () => {
  const { user, logout, isAdmin, isStudent, loading: authLoading } = useAuth();
  const { loadingData } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Check if current route is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, navigate, authLoading]);

  // Track page views for analytics
  useEffect(() => {
    if (user) {
      console.log(`User ${user.id} viewed page: ${location.pathname}`);
      // This could later connect to analytics service
    }
  }, [location.pathname, user]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    toast.success(`${darkMode ? 'Light' : 'Dark'} mode activated`);
  };

  const handleSidebarToggle = () => {
    setIsOpen(!isOpen);
  };

  if (authLoading || loadingData) {
    return <Loading fullScreen message="Loading your dashboard..." />;
  }

  if (!user) return null;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-wellness-cream'}`}>
      <Navbar onSidebarToggle={handleSidebarToggle} isSidebarOpen={isOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isOpen} />
        
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-auto p-4 md:p-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      
      {/* Enhanced Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-wellness-light-blue/30 dark:border-gray-700/50 py-4 px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Wellness Education Portal
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-sm text-wellness-blue dark:text-wellness-light-blue hover:text-wellness-blue/80 dark:hover:text-wellness-light-blue/80 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
            
            <button 
              onClick={() => navigate('/profile')}
              className="text-sm text-wellness-blue dark:text-wellness-light-blue hover:text-wellness-blue/80 dark:hover:text-wellness-light-blue/80 flex items-center gap-1 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            
            <button 
              onClick={toggleDarkMode}
              className="text-sm text-wellness-blue dark:text-wellness-light-blue hover:text-wellness-blue/80 dark:hover:text-wellness-light-blue/80 flex items-center gap-1 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{darkMode ? 'Light' : 'Dark'} Mode</span>
            </button>
            
            <button 
              onClick={logout}
              className="text-sm text-wellness-blue dark:text-wellness-light-blue hover:text-wellness-blue/80 dark:hover:text-wellness-light-blue/80 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Show ChatbotWidget only for students and non-admin routes */}
      {isStudent && !isAdminRoute && <ChatbotWidget />}
    </div>
  );
};

export default MainLayout;
