import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Palette, TrendingUp, Rocket, Crown } from 'lucide-react';

const steps = [
  {
    icon: Target,
    title: 'Strategy',
    description: 'We analyze your business, market, and competitors to develop a winning roadmap tailored to your goals.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: 'Design',
    description: 'Our creative team crafts stunning visuals and content that capture your brand essence.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Marketing',
    description: 'Execute targeted campaigns across multiple channels to reach and engage your audience.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Rocket,
    title: 'Growth',
    description: 'Monitor, optimize, and scale your campaigns for continuous improvement and expansion.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Crown,
    title: 'Scale',
    description: 'Transform your success into market leadership with advanced strategies and automation.',
    color: 'from-yellow-500 to-amber-500',
  },
];

export default function WhyChooseUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="section-padding relative bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Our Process</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">Why Choose Us</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our proven five-step process ensures your success at every stage of your digital journey.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-blue-500/50 rounded-full" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className={`relative flex items-center mb-24 last:mb-0 ${
                index % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Card */}
              <div
                className={`w-full md:w-[calc(50%-3rem)] ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                }`}
              >
                <div className="glass-card p-6 group hover:bg-white/5 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10">
                  {/* Step Number */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-white/10 group-hover:text-white/20 transition-colors duration-300">
                      0{index + 1}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Timeline Dot */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 border-4 border-gray-950 z-10"
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: index * 0.15 + 0.1 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="glass-card w-full max-w-lg mx-auto p-8 md:p-10 text-center">
            <h3 className="text-2xl font-bold font-sora mb-4 gradient-text">Ready to Start Your Journey?</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Let's discuss how we can help transform your business with our proven strategies.
            </p>
            <a
              href="#contact"
              className="btn-primary inline-flex items-center justify-center w-full sm:w-auto !whitespace-normal !text-center !leading-snug !min-h-[48px] !px-6 !py-3"
            >
              Schedule a Free Consultation
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
