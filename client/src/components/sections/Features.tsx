import { motion } from "framer-motion";

const features = [
  {
    icon: "code",
    title: "Structured Learning Paths",
    description: "Progressive programming courses with clear learning paths designed specifically for beginners to advanced coders.",
    color: "primary"
  },
  {
    icon: "psychology",
    title: "Mental Wellness Integration",
    description: "Mindfulness exercises, stress management tools, and mood tracking built directly into your learning experience.",
    color: "secondary"
  },
  {
    icon: "smart_toy",
    title: "Personalized Learning",
    description: "Adaptive learning algorithms that adjust to your pace, learning style, and mental state to optimize your education.",
    color: "accent"
  },
  {
    icon: "school",
    title: "Flexible Scheduling",
    description: "Set your own learning schedule with no deadlines or pressure, ideal for managing study alongside other responsibilities.",
    color: "primary"
  },
  {
    icon: "forum",
    title: "Supportive Community",
    description: "Connect with peers who understand both coding challenges and mental health management in our moderated forums.",
    color: "secondary"
  },
  {
    icon: "auto_awesome",
    title: "Progress Tracking",
    description: "Visualize both your academic progress and wellbeing metrics to see how they correlate and improve over time.",
    color: "accent"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const Features = () => {
  return (
    <section className="py-16 px-4 bg-white dark:bg-darkBg transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-4">How We Support Your Journey</h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Combining programming education with mental health support in a single, thoughtfully designed platform.
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="bg-background dark:bg-gray-800 p-6 rounded-standard shadow-soft hover:transform hover:scale-[1.01] hover:shadow-md transition-all duration-200"
              variants={itemVariants}
            >
              <div className={`w-12 h-12 bg-${feature.color}/10 dark:bg-${feature.color}/20 flex items-center justify-center rounded-standard mb-4`}>
                <span className={`material-icons text-${feature.color}`}>{feature.icon}</span>
              </div>
              <h3 className="text-xl font-outfit font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
