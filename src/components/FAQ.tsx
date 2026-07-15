import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'What services does Grow with Us offer?',
    answer: 'We offer comprehensive digital marketing services including social media management, performance marketing (Facebook & Google Ads), SEO, website development, branding, video editing, AI automation, WhatsApp marketing, CRM solutions, and graphic design. Our all-in-one approach ensures cohesive marketing strategies across all channels.',
  },
  {
    question: 'How long does it take to see results?',
    answer: 'Results vary based on your goals and current market position. Typically, you\'ll begin seeing engagement improvements within the first month. For more substantial results like lead generation and sales growth, most clients see significant impact within 3-6 months. We provide regular reports to track progress every step of the way.',
  },
  {
    question: 'Do you work with businesses of all sizes?',
    answer: 'Absolutely! We serve everyone from ambitious startups to established enterprises. Our flexible pricing plans are designed to accommodate different budgets and needs. We believe every business deserves access to premium marketing services, regardless of size.',
  },
  {
    question: 'What makes Grow with Us different from other agencies?',
    answer: 'Our AI-powered approach sets us apart. We combine cutting-edge technology with creative excellence and data-driven strategies. Our team doesn\'t just execute campaigns—we become a true partner in your growth. Plus, our all-in-one service model means you don\'t need multiple vendors for different marketing needs.',
  },
  {
    question: 'How do you measure campaign success?',
    answer: 'We track comprehensive metrics aligned with your business goals—engagement rates, lead generation, conversion rates, ROI, and more. Our monthly reports provide clear insights into performance, and we continuously optimize based on data. We believe in full transparency, so you always know where your investment is going.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a satisfaction guarantee. If you\'re not happy with our services within the first 30 days, we\'ll work with you to make it right or provide a prorated refund. We\'re confident in our abilities and want you to feel secure in your investment.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can adjust your plan at any time. We understand that business needs change, and we\'re flexible to accommodate your growth. Upgrades take effect immediately, while downgrades are processed at the start of your next billing cycle.',
  },
  {
    question: 'Do you provide dedicated account management?',
    answer: 'Yes! Every client gets a dedicated account manager who serves as your primary point of contact. Growth and Enterprise plans include monthly strategy calls and more hands-on support. We believe strong communication is key to success.',
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section-padding relative bg-gradient-to-b from-black via-gray-950 to-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px] -translate-y-1/2" />
      </div>

      <div className="container-padding relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">FAQ</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
              <span className="gradient-text">Frequently Asked Questions</span>
            </h2>
            <p className="text-gray-400">
              Got questions? Find answers to the most common inquiries below.
            </p>
          </motion.div>

          {/* FAQ Items */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors duration-300"
                >
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  <motion.div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center"
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {openIndex === index ? (
                      <Minus className="w-4 h-4 text-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6">
                        <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>

          {/* Still Have Questions */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-gray-400 mb-4">
              Still have questions? We're here to help.
            </p>
            <a href="#contact" className="btn-primary">
              Contact Our Team
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
