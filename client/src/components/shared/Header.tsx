import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import useDarkMode from "@/hooks/useDarkMode";
import { useStreak } from "@/context/streak-context";

const navLinks = [
  { name: "Courses", href: "/courses" },
  { name: "Mental Health", href: "/mental-health" },
  { name: "Community", href: "/community" },
  { name: "Cheat Sheets", href: "/cheat-sheets" },
  { name: "Summarizer", href: "https://karetextsummarizer.streamlit.app", external: true },
  { name: "Chatbot", href: "/chatbot", icon: "chat" },
];

const Header = () => {
  const [location] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { streak, forceShowStreakPopup } = useStreak();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // Mock user state for demo (in a real app, this would come from auth context)
  const [isLoggedIn] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`sticky top-0 z-50 bg-white dark:bg-darkBg ${isScrolled ? 'shadow-sm' : ''} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <div className="mr-2 text-primary dark:text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l8 4A1 1 0 0119 6v8a1 1 0 01-.504.868l-8 4a1 1 0 01-.992 0l-8-4A1 1 0 011 14V6a1 1 0 01.504-.868l8-4zM8 7a1 1 0 00-1 1v5a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-outfit font-semibold">Neuro Edu</h1>
            </a>
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            link.external ? (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-outfit text-sm font-medium transition-colors hover:text-primary dark:hover:text-accent"
              >
                {link.name}
              </a>
            ) : (
              <Link key={link.name} href={link.href}>
                <a className={`font-outfit text-sm font-medium transition-colors ${
                  location === link.href
                    ? 'text-primary dark:text-accent'
                    : 'hover:text-primary dark:hover:text-accent'
                }`}>
                  {link.name}
                </a>
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Streak indicator */}
          {isLoggedIn && (
            <motion.button
              onClick={() => forceShowStreakPopup()}
              className="hidden md:flex items-center px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="View streak details"
              title="Your current learning streak"
            >
              <span className="material-icons text-sm mr-1">local_fire_department</span>
              <span>{streak} day{streak !== 1 ? 's' : ''}</span>
            </motion.button>
          )}

          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileTap={{ scale: 0.9 }}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-icons dark:hidden">dark_mode</span>
            <span className="material-icons hidden dark:block">light_mode</span>
          </motion.button>
          {isLoggedIn ? (
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard">
                <a className="flex items-center px-4 py-2 rounded-standard text-sm font-medium text-primary dark:text-accent hover:bg-primary/10 dark:hover:bg-accent/10 transition-colors">
                  <span className="material-icons mr-1 text-sm">dashboard</span>
                  Dashboard
                </a>
              </Link>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <Link href="/signin">
              <a className="hidden md:block bg-primary hover:bg-opacity-90 text-white dark:bg-accent dark:text-darkBg px-4 py-2 rounded-standard text-sm font-medium transition-colors">
                Sign In
              </a>
            </Link>
          )}
          <button
            className="md:hidden text-textColor dark:text-darkText"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white dark:bg-gray-800 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-3 space-y-3">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-outfit text-sm font-medium py-2 hover:text-primary dark:hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link key={link.name} href={link.href}>
                    <a
                      className={`block font-outfit text-sm font-medium py-2 ${
                        location === link.href
                          ? 'text-primary dark:text-accent'
                          : 'hover:text-primary dark:hover:text-accent'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  </Link>
                )
              ))}
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <a
                      className="block py-2 text-sm font-medium flex items-center text-primary dark:text-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="material-icons mr-1 text-sm">dashboard</span>
                      Dashboard
                    </a>
                  </Link>
                  <div className="flex items-center py-2 mt-2 space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">Alex Johnson</span>
                  </div>
                </>
              ) : (
                <Link href="/signin">
                  <a
                    className="block bg-primary hover:bg-opacity-90 text-white dark:bg-accent dark:text-darkBg px-4 py-2 rounded-standard text-sm font-medium transition-colors text-center mt-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </a>
                </Link>
              )}
              {/* Mobile streak indicator */}
              {isLoggedIn && (
                <button
                  onClick={() => {
                    forceShowStreakPopup();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md text-sm font-medium"
                >
                  <span className="material-icons text-sm mr-1">local_fire_department</span>
                  <span>{streak} day streak</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
