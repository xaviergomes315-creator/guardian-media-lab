
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    icon: Sparkles,
    description: 'Perfect for small businesses starting their digital journey',
    monthlyPrice: 4999,
    features: [
      'Social Media Management',
      '12 Posts/Month',
      'Basic SEO',
      'Monthly Report',
      'Email Support',
    ],
    isPopular: false,
  },
  {
    name: 'Professional',
    icon: Zap,
    description: 'Ideal for businesses ready to scale their marketing',
    monthlyPrice: 9999,
    features: [
      'Everything in Starter',
      'Facebook & Instagram Ads',
      '20 Posts/Month',
      'Lead Generation',
      'WhatsApp Support',
      'Priority Support',
    ],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    icon: Crown,
    description: 'Complete solution for established businesses',
    monthlyPrice: 19999,
    features: [
      'Everything in Professional',
      'Unlimited Social Media Posts',
      'Dedicated Account Manager',
      'CRM Access',
      'AI Automation',
      'Advanced Analytics',
      'Premium Support',
    ],
    isPopular: false,
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });


  return (
    <section id="pricing" className="section-padding relative bg-black" ref={ref}>
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[200px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 font-medium mb-4 text-sm uppercase tracking-wider">Pricing</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sora mb-4">
            <span className="gradient-text">Investment Plans</span> for Growth
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transparent pricing designed to deliver maximum ROI. Choose the plan that fits your business goals.
          </p>
        </motion.div>



        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative ${plan.isPopular ? 'lg:-mt-4' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-500/25">
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`h-full glass-card p-8 transition-all duration-500 hover:scale-[1.02] ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-blue-600/10 to-transparent border-blue-500/30 premium-shadow'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${plan.isPopular ? 'bg-blue-600' : 'bg-white/10'}`}>
                    <plan.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-sora text-white">
                      ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.isPopular ? 'bg-blue-600' : 'bg-green-500'}`}>
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <a
                  href="#contact"
                  className={`w-full block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                    plan.isPopular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  Get Started
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Quote */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="text-gray-400 mb-4">
            Need a custom solution? We offer tailored packages to fit your unique needs.
          </p>
          <a href="#contact" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-2 transition-colors duration-300">
            Contact us for a custom quote
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
