
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavbarProps {
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

const Navbar = ({ onSidebarToggle, isSidebarOpen }: NavbarProps) => {
  const { user, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all">
      <nav className="bg-white/80 backdrop-blur-md border-b border-wellness-light-blue/30">
        <div className="mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and site name */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-wellness-blue flex items-center justify-center text-white font-semibold animate-pulse-slow">
                  WE
                </div>
                <span className="font-semibold text-xl text-gray-800">Wellness Education</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link to="/videos" className="wellness-link text-gray-700 hover:text-wellness-blue transition-colors">
                Videos
              </Link>
              <Link to="/games" className="wellness-link text-gray-700 hover:text-wellness-blue transition-colors">
                Games
              </Link>
              <Link to="/meditations" className="wellness-link text-gray-700 hover:text-wellness-blue transition-colors">
                Meditations
              </Link>
              {isAdmin && (
                <Link to="/admin" className="wellness-link text-gray-700 hover:text-wellness-blue transition-colors">
                  Admin
                </Link>
              )}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button 
                onClick={toggleDarkMode}
                className="rounded-full p-2 text-gray-600 hover:text-wellness-blue hover:bg-gray-100 transition-all"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {/* User info */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Hello,</div>
                  <div className="font-medium">{user?.name || 'Guest'}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-wellness-blue flex items-center justify-center text-white">
                  {user?.name.charAt(0) || 'G'}
                </div>
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-wellness-blue hover:bg-gray-100 focus:outline-none transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 animate-slide-down">
              <Link
                to="/videos"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-wellness-blue hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Videos
              </Link>
              <Link
                to="/games"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-wellness-blue hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Games
              </Link>
              <Link
                to="/meditations"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-wellness-blue hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Meditations
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-wellness-blue hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
