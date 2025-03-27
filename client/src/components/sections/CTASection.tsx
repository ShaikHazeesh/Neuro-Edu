import { motion } from "framer-motion";
import { Link } from "wouter";

const CTASection = () => {
  return (
    <section className="py-16 px-4 bg-primary/10 dark:bg-primary/20 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <motion.div 
          className="rounded-standard bg-white dark:bg-gray-800 p-8 md:p-12 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-4">Ready to start your journey?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join our community of learners who are building their programming skills while prioritizing mental wellness.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="material-icons text-primary mr-2 mt-0.5">check_circle</span>
                  <span>Access to all courses and mental health resources</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-primary mr-2 mt-0.5">check_circle</span>
                  <span>Personalized AI support for learning and wellbeing</span>
                </li>
                <li className="flex items-start">
                  <span className="material-icons text-primary mr-2 mt-0.5">check_circle</span>
                  <span>Join our supportive community of like-minded students</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/auth" className="bg-primary hover:bg-opacity-90 text-white px-6 py-3 rounded-standard font-medium transition-colors shadow-soft hover:shadow-md text-center inline-block">
                  Get Started Free
                </Link>
                <Link to="/courses" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText px-6 py-3 rounded-standard font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center inline-block">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="md:w-1/3">
              <div className="relative">
                <motion.div 
                  className="bg-accent/20 dark:bg-accent/30 w-60 h-60 rounded-full absolute -top-5 -right-5 -z-10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                ></motion.div>
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Students learning" 
                  className="rounded-standard shadow-md relative z-10" 
                />
                <motion.div 
                  className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-soft z-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center">
                    <div className="flex -space-x-2 mr-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white dark:border-gray-800">S</div>
                      <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center border-2 border-white dark:border-gray-800">J</div>
                      <div className="w-8 h-8 rounded-full bg-accent text-darkBg flex items-center justify-center border-2 border-white dark:border-gray-800">M</div>
                    </div>
                    <div className="text-xs font-medium">500+ students<br/>joined this month</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
