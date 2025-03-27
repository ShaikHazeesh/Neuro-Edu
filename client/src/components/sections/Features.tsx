import { motion } from "framer-motion";

const features = [
  {
    icon: "code",
    title: "Interactive Coding",
    description: "Learn programming through video lectures and hands-on exercises designed to build your skills gradually.",
    color: "primary"
  },
  {
    icon: "psychology",
    title: "Mental Wellness",
    description: "Access tools like guided breathing exercises, mood tracking, and support forums whenever you need them.",
    color: "secondary"
  },
  {
    icon: "smart_toy",
    title: "AI Learning Assistant",
    description: "Get personalized help with coding problems and mental health resources through our supportive AI chatbot.",
    color: "accent"
  },
  {
    icon: "school",
    title: "Self-Paced Learning",
    description: "Take courses at your own speed with no pressure, and easily pick up where you left off when you're ready.",
    color: "primary"
  },
  {
    icon: "forum",
    title: "Supportive Community",
    description: "Connect with peers who understand both the challenges of learning to code and managing mental health.",
    color: "secondary"
  },
  {
    icon: "auto_awesome",
    title: "Quick Reference",
    description: "Access cheat sheets and quick reference guides to reinforce concepts without overwhelming study sessions.",
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
