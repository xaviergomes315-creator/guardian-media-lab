import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Users, Globe, ThumbsUp, HeadphonesIcon } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 500,
    suffix: '+',
    label: 'Happy Clients',
    description: 'Trusted by businesses worldwide',
  },
  {
    icon: Globe,
    value: 5,
    suffix: 'M+',
    label: 'Reach Generated',
    description: 'Social media impressions',
  },
  {
    icon: ThumbsUp,
    value: 98,
    suffix: '%',
    label: 'Client Satisfaction',
    description: 'Outstanding results delivered',
  },
  {
    icon: HeadphonesIcon,
    value: 24,
    suffix: '/7',
    label: 'Support',
    description: 'Always here for you',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function Trust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="section-padding relative bg-gradient-to-b from-black via-gray-950 to-black" ref={ref}>
      <div className="container-padding">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Why Trust Us</p>
          <h2 className="text-3xl md:text-4xl font-bold font-sora mb-4">
            <span className="gradient-text">Proven Results</span> That Speak
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We deliver measurable outcomes for our clients through strategic planning and cutting-edge marketing techniques.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="glass-card p-6 md:p-8 text-center hover:bg-white/10 transition-all duration-500 group-hover:scale-105">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-400/20 mb-4 group-hover:from-blue-600/30 group-hover:to-blue-400/30 transition-all duration-500">
                  <stat.icon className="w-7 h-7 text-blue-400" />
                </div>

                {/* Value */}
                <div className="text-3xl md:text-4xl font-bold font-sora text-white mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <h3 className="text-lg font-semibold text-white mb-1">{stat.label}</h3>
                <p className="text-sm text-gray-500">{stat.description}</p>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Brands/Trust Badges */}
        <motion.div
          className="mt-16 pt-16 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by leading brands and startups worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            {['Meta Business Partner', 'Google Partner', 'HubSpot Certified', 'Semrush Partner'].map((brand, i) => (
              <motion.div
                key={brand}
                className="px-6 py-3 glass-card text-gray-400 text-sm font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              >
                {brand}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
