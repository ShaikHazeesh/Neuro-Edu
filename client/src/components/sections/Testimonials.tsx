import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah L.",
    role: "Computer Science Student",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    quote: "The combination of mental health support alongside coding courses made a huge difference. I was able to learn at my own pace without feeling overwhelmed.",
    rating: 5
  },
  {
    name: "Michael J.",
    role: "Self-taught Developer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    quote: "The AI assistant helped me through numerous coding roadblocks and gave me coping strategies when I felt stressed. It's like having a tutor and therapist in one!",
    rating: 4.5
  },
  {
    name: "Priya R.",
    role: "Career Changer",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    quote: "The community forum helped me realize I wasn't alone in my struggles. The programming cheat sheets made complex concepts more digestible during high-stress periods.",
    rating: 5
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-outfit font-bold mb-4">Student Stories</h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Hear from students who found success through our supportive approach to learning.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index} 
              className="bg-background dark:bg-darkBg p-6 rounded-standard shadow-soft"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover" 
                />
                <div className="ml-4">
                  <h3 className="font-outfit font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              <blockquote className="text-gray-600 dark:text-gray-300 italic mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex text-yellow-400">
                {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                  <span key={i} className="material-icons">star</span>
                ))}
                {testimonial.rating % 1 !== 0 && (
                  <span className="material-icons">star_half</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
