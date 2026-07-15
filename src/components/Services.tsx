import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Share2,
  TrendingUp,
  Facebook,
  Search,
  Globe,
  Palette,
  Zap,
  Video,
  Bot,
  MessageCircle,
  Database,
  PenTool,
} from 'lucide-react';

const services = [
  {
    icon: Share2,
    title: 'Social Media Management',
    description: 'Strategic content creation, scheduling, and community management to build your online presence.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: 'Performance Marketing',
    description: 'Data-driven campaigns optimized for maximum ROI across all digital channels.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Facebook,
    title: 'Facebook Ads',
    description: 'Targeted advertising campaigns that reach your ideal customers and drive conversions.',
    color: 'from-blue-600 to-blue-400',
  },
  {
    icon: Search,
    title: 'Google Ads',
    description: 'Search and display advertising that puts your business in front of ready-to-buy customers.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Globe,
    title: 'SEO',
    description: 'Organic search optimization to improve rankings and drive sustainable traffic growth.',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    icon: Palette,
    title: 'Website Development',
    description: 'Modern, responsive websites built for performance, conversions, and user experience.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: PenTool,
    title: 'Branding',
    description: 'Complete brand identity design that makes your business memorable and trustworthy.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Video,
    title: 'Video Editing',
    description: 'Professional video production and editing for social media, ads, and marketing campaigns.',
    color: 'from-rose-500 to-red-400',
  },
  {
    icon: Bot,
    title: 'AI Automation',
    description: 'Intelligent automation solutions that streamline operations and boost efficiency.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Marketing',
    description: 'Direct marketing campaigns via WhatsApp with personalized messaging and automation.',
    color: 'from-green-400 to-green-600',
  },
  {
    icon: Database,
    title: 'CRM Solutions',
    description: 'Customer relationship management systems to nurture leads and retain customers.',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    icon: Zap,
    title: 'Graphic Design',
    description: 'Eye-catching visuals for social media, ads, packaging, and marketing materials.',
    color: 'from-pink-500 to-rose-500',
  },
];

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section id="services" className="section-padding relative bg-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Our Services</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">Comprehensive Solutions</span> for
            <br className="hidden md:block" /> Your Digital Growth
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From strategy to execution, we provide end-to-end digital marketing services
            designed to accelerate your business growth.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="glass-card p-6 h-full hover:bg-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {service.description}
                </p>

                {/* Hover Arrow */}
                <motion.div
                  className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>

                {/* Border Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a href="#pricing" className="btn-primary inline-flex items-center gap-2">
            View Pricing Plans
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
