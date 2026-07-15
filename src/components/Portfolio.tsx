import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const categories = ['All', 'Branding', 'Ads', 'Website', 'Social Media', 'Video Editing'];

const projects = [
  {
    id: 1,
    title: 'E-Commerce Brand Launch',
    category: 'Branding',
    description: 'Complete brand identity design for a luxury fashion e-commerce startup, including logo, color palette, typography, and brand guidelines.',
    image: 'https://images.pexels.com/photo-1556742049-0a2af9ab87d1?w=800&h=600&fit=crop',
    metrics: ['300% increase in brand recognition', '2M+ impressions', '45% higher engagement'],
  },
  {
    id: 2,
    title: 'SaaS Google Ads Campaign',
    category: 'Ads',
    description: 'Multi-channel advertising campaign for a B2B SaaS company, achieving record-breaking lead generation results.',
    image: 'https://images.pexels.com/photo-1460925895914-881358d77140?w=800&h=600&fit=crop',
    metrics: ['500% ROAS', '10,000+ leads generated', '65% lower CPA'],
  },
  {
    id: 3,
    title: 'Restaurant Website Redesign',
    category: 'Website',
    description: 'Modern, responsive website design for an upscale restaurant chain with online ordering and reservation system.',
    image: 'https://images.pexels.com/photo-1462896473083-ff613c5f8dbf?w=800&h=600&fit=crop',
    metrics: ['200% increase in online orders', '89% faster load time', '35% more reservations'],
  },
  {
    id: 4,
    title: 'Fitness Brand Social Media',
    category: 'Social Media',
    description: 'Comprehensive social media strategy and content creation for a fitness brand, growing their audience exponentially.',
    image: 'https://images.pexels.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    metrics: ['500K new followers', '12M+ monthly reach', '85% engagement boost'],
  },
  {
    id: 5,
    title: 'Tech Startup Promo Video',
    category: 'Video Editing',
    description: 'Professional product launch video series for a tech startup, showcasing their innovative features.',
    image: 'https://images.pexels.com/photo-2010830376278-86f78e4ad244?w=800&h=600&fit=crop',
    metrics: ['5M+ video views', '3x longer watch time', 'Viral on TikTok'],
  },
  {
    id: 6,
    title: 'Financial Services Facebook Ads',
    category: 'Ads',
    description: 'Highly targeted Facebook advertising campaign for a fintech company, driving qualified leads at scale.',
    image: 'https://images.pexels.com/photo-1460925895914-881358d77140?w=800&h=600&fit=crop',
    metrics: ['1200% ROAS', '5000+ monthly leads', '-45% cost per lead'],
  },
  {
    id: 7,
    title: 'Luxury Hotel Branding',
    category: 'Branding',
    description: 'Sophisticated brand identity for a boutique hotel chain, reflecting premium positioning and unique experiences.',
    image: 'https://images.pexels.com/photo-2017667116063-97ebd5dea2db?w=800&h=600&fit=crop',
    metrics: ['#1 rated hotel brand', '40% premium pricing', '95% brand recall'],
  },
  {
    id: 8,
    title: 'Real Estate Social Campaign',
    category: 'Social Media',
    description: 'Strategic social media marketing for a real estate developer, generating quality property inquiries.',
    image: 'https://images.pexels.com/photo-1560518883-ce0902ee4f4a?w=800&h=600&fit=crop',
    metrics: ['300+ property sales', '2M content impressions', '4.5x ROI'],
  },
];

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  metrics: string[];
}

export default function Portfolio() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(project => project.category === activeCategory);

  const currentProjectIndex = selectedProject
    ? filteredProjects.findIndex(p => p.id === selectedProject.id)
    : -1;

  const handlePrev = () => {
    if (currentProjectIndex > 0) {
      setSelectedProject(filteredProjects[currentProjectIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentProjectIndex < filteredProjects.length - 1) {
      setSelectedProject(filteredProjects[currentProjectIndex + 1]);
    }
  };

  return (
    <section id="portfolio" className="section-padding relative bg-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Our Work</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">Featured Projects</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore our portfolio of successful campaigns and creative projects that have driven real results for our clients.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'glass-card text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="glass-card overflow-hidden hover:bg-white/5 transition-all duration-500">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Project Modal */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
            >
              <motion.div
                className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto glass-card p-6 md:p-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 p-2 rounded-full glass-card hover:bg-white/10 transition-colors duration-300"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Navigation */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentProjectIndex === 0}
                    className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors duration-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentProjectIndex === filteredProjects.length - 1}
                    className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors duration-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Image */}
                <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white">
                      {selectedProject.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl md:text-3xl font-bold font-sora text-white mb-4">
                  {selectedProject.title}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {selectedProject.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {selectedProject.metrics.map((metric, index) => (
                    <div key={index} className="glass-card-dark p-4 text-center">
                      <p className="text-sm font-semibold text-blue-400">{metric}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="#contact"
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => setSelectedProject(null)}
                >
                  Start a Similar Project
                  <ExternalLink className="w-4 h-4" />
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
