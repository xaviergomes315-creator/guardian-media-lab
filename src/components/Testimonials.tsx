import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    content: "Grow with Us transformed our online presence completely. Our social media engagement increased by 500% and we've seen a direct impact on our sales. Their team truly understands digital marketing at a deep level.",
    author: 'Sarah Johnson',
    role: 'CEO, TechStart Inc.',
    image: 'https://images.pexels.com/photo-7749094?w=150&h=150&fit=crop&crop=face',
    rating: 5,
  },
  {
    id: 2,
    content: "The ROI we've achieved through their Facebook and Google Ads campaigns has been incredible. They don't just run ads – they build strategies that actually convert. Our cost per acquisition dropped by 60%.",
    author: 'Michael Chen',
    role: 'Marketing Director, FinanceHub',
    image: 'https://images.pexels.com/photo-2204534?w=150&h=150&fit=crop&crop=face',
    rating: 5,
  },
  {
    id: 3,
    content: "Working with Grow with Us has been a game-changer for our brand. Their branding work helped us stand out in a crowded market, and our new website has received countless compliments from customers.",
    author: 'Emily Rodriguez',
    role: 'Founder, StyleCraft',
    image: 'https://images.pexels.com/photo-1239291?w=150&h=150&fit=crop&crop=face',
    rating: 5,
  },
  {
    id: 4,
    content: "Their AI-powered marketing solutions are ahead of the curve. The automation workflows they set up have saved us countless hours while improving our lead nurturing. Truly innovative team.",
    author: 'David Park',
    role: 'CTO, InnovateTech',
    image: 'https://images.pexels.com/photo-2379005?w=150&h=150&fit=crop&crop=face',
    rating: 5,
  },
  {
    id: 5,
    content: "From SEO to social media management, every service they provided exceeded our expectations. They're not just a vendor – they're a true partner in our growth. Highly recommend!",
    author: 'Amanda Foster',
    role: 'VP Marketing, GrowthCo',
    image: 'https://images.pexels.com/photo-1065054?w=150&h=150&fit=crop&crop=face',
    rating: 5,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section id="testimonials" className="section-padding relative bg-gradient-to-b from-black via-gray-950 to-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[200px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[150px] -translate-y-1/2" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Testimonials</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">What Our Clients Say</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our clients have to say about working with Grow with Us.
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="relative h-[400px] md:h-[350px]">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <div className="glass-card p-8 md:p-10 h-full flex flex-col justify-center relative overflow-hidden">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-8 opacity-10">
                    <Quote className="w-24 h-24 text-blue-400" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-500 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 italic">
                    "{testimonials[currentIndex].content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                      {testimonials[currentIndex].author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{testimonials[currentIndex].author}</h4>
                      <p className="text-sm text-gray-400">{testimonials[currentIndex].role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full glass-card hover:bg-white/10 transition-colors duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-blue-500 w-8' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-3 rounded-full glass-card hover:bg-white/10 transition-colors duration-300"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-gray-400 mb-4">
            Join 500+ clients who trust us with their digital growth
          </p>
          <a href="#contact" className="btn-primary">
            Start Your Success Story
          </a>
        </motion.div>
      </div>
    </section>
  );
}
