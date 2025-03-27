import { motion } from "framer-motion";
import { Link } from "wouter";

const tools = [
  {
    title: "Breathing Exercise",
    description: "Take a moment to calm your mind with guided breathing.",
    icon: "air",
    color: "primary",
    action: "Start Exercise",
    path: "/mental-health/breathing"
  },
  {
    title: "Mood Journal",
    description: "Track your emotional wellbeing and identify patterns.",
    icon: "auto_stories",
    color: "secondary",
    action: "Open Journal",
    path: "/mental-health/journal"
  },
  {
    title: "Community Support",
    description: "Connect with peers who understand your journey.",
    icon: "diversity_3",
    color: "accent",
    action: "Join Forum",
    path: "/community"
  }
];

const MentalHealthTools = () => {
  return (
    <section id="tools" className="py-16 px-4 bg-background dark:bg-darkBg transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-4">Mental Health Tools</h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Resources to support your wellbeing alongside your learning journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <motion.div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft hover:transform hover:scale-[1.01] hover:shadow-md transition-all duration-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-4 flex justify-center">
                <motion.div 
                  className={`w-24 h-24 rounded-full bg-${tool.color}/10 dark:bg-${tool.color}/20 flex items-center justify-center`}
                  animate={tool.icon === "air" ? { scale: [1, 1.1, 1] } : {}}
                  transition={tool.icon === "air" ? { repeat: Infinity, duration: 5, ease: "easeInOut" } : {}}
                >
                  <span className={`material-icons text-3xl text-${tool.color}`}>{tool.icon}</span>
                </motion.div>
              </div>
              <h3 className="text-xl font-outfit font-semibold mb-2 text-center">{tool.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">{tool.description}</p>
              <Link href={tool.path} className={`w-full bg-${tool.color} hover:bg-opacity-90 ${tool.color === 'accent' ? 'text-darkBg' : 'text-white'} py-2 rounded-standard font-medium text-sm transition-colors block text-center`}>
                {tool.action}
              </Link>
            </motion.div>
          ))}
        </div>
        
        {/* Crisis Resources */}
        <motion.div 
          className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-standard shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="material-icons text-red-500">support</span>
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-xl font-outfit font-semibold mb-2">Need immediate support?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">If you're feeling overwhelmed or in crisis, help is available 24/7.</p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:988" className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-standard text-sm font-medium transition-colors">
                  <span className="material-icons text-sm mr-1 align-text-bottom">call</span> Crisis Hotline
                </a>
                <a href="/mental-health/text-support" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText px-4 py-2 rounded-standard text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span className="material-icons text-sm mr-1 align-text-bottom">chat</span> Text Support
                </a>
                <a href="/mental-health/local-resources" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-textColor dark:text-darkText px-4 py-2 rounded-standard text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span className="material-icons text-sm mr-1 align-text-bottom">location_on</span> Local Resources
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MentalHealthTools;
