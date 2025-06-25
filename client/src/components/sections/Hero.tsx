import { Link } from "wouter";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-background to-primary/10 dark:from-darkBg dark:to-primary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div
            className="md:w-1/2 mb-8 md:mb-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-outfit font-bold mb-4 leading-tight">
              Learn Programming With <span className="text-primary dark:text-accent">Mental Wellbeing</span>
            </h1>
            <p className="text-lg mb-8 max-w-lg opacity-90 dark:opacity-80">
              Neuro Edu combines programming education with mental health support to help students succeed both academically and personally. Our platform offers structured courses, personalized learning paths, and wellness tools in one integrated experience.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/courses" className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-standard font-medium text-center transition-all shadow-soft hover:shadow-md">
                Explore Courses
              </Link>
              <Link href="/mental-health" className="bg-white dark:bg-darkBg border border-primary dark:border-accent text-primary dark:text-accent px-6 py-3 rounded-standard font-medium text-center transition-all hover:bg-primary/5 dark:hover:bg-accent/10 shadow-soft">
                Mental Health Support
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="md:w-1/2 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full h-80 md:h-96">
              <motion.img
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Students learning together"
                className="w-full h-full object-cover rounded-standard shadow-md"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white dark:bg-darkBg p-4 rounded-standard shadow-soft"
                whileHover={{ y: -3, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-sm font-medium">Mental Wellness Check-in</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-textColor">😊 Good</button>
                  <button className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-textColor dark:text-darkText">😐 Okay</button>
                  <button className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-textColor dark:text-darkText">😔 Struggling</button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
