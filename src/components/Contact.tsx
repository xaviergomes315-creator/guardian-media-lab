import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, Loader2 } from 'lucide-react';

const serviceOptions = [
  'Social Media Management',
  'Performance Marketing',
  'Facebook Ads',
  'Google Ads',
  'SEO',
  'Website Development',
  'Branding',
  'Video Editing',
  'AI Automation',
  'WhatsApp Marketing',
  'CRM Solutions',
  'Graphic Design',
];

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    service: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="section-padding relative bg-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Contact Us</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">Let's Start Your Growth Journey</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Book a free consultation to discuss your marketing goals. We'll show you how we can help transform your business.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Book Free Consultation</h3>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Message Sent Successfully!</h4>
                  <p className="text-gray-400">We'll get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-2">
                      Service Required *
                    </label>
                    <select
                      id="service"
                      name="service"
                      required
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors duration-300 appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-gray-900">Select a service</option>
                      {serviceOptions.map((service) => (
                        <option key={service} value={service} className="bg-gray-900">
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300 resize-none"
                      placeholder="Tell us about your project and goals..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Info Cards */}
            <div className="grid gap-4">
              <a
                href="mailto:contact@growwithus.in"
                className="glass-card p-5 flex items-center gap-4 hover:bg-white/5 transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email us</p>
                  <p className="text-white font-medium">contact@growwithus.in</p>
                </div>
              </a>

              <a
                href="tel:+919876543210"
                className="glass-card p-5 flex items-center gap-4 hover:bg-white/5 transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center group-hover:bg-green-600 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-green-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Call us</p>
                  <p className="text-white font-medium">+91 98765 43210</p>
                </div>
              </a>

              <a
                href="https://wa.me/919876543210"
                className="glass-card p-5 flex items-center gap-4 hover:bg-white/5 transition-colors duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                  <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">WhatsApp</p>
                  <p className="text-white font-medium">+91 98765 43210</p>
                </div>
              </a>

              <div className="flex items-center gap-5">
                <div className="glass-card p-5 flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Working Hours</p>
                    <p className="text-white font-medium">Mon–Sat, 10am–7pm IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="glass-card overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
                <div className="relative text-center">
                  <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-1">Grow with Us</p>
                  <p className="text-gray-400 text-sm">Lucknow, Uttar Pradesh, India</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
