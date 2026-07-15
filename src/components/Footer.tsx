import { Shield, Facebook, Instagram, Linkedin, Twitter, Youtube, ArrowUp, Mail } from 'lucide-react';

const quickLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Services', href: '#services' },
  { name: 'Portfolio', href: '#portfolio' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Blog', href: '#blog' },
  { name: 'Contact', href: '#contact' },
];

const services = [
  { name: 'Social Media Management', href: '#services' },
  { name: 'Performance Marketing', href: '#services' },
  { name: 'SEO Optimization', href: '#services' },
  { name: 'Website Development', href: '#services' },
  { name: 'Branding & Design', href: '#services' },
  { name: 'AI Automation', href: '#services' },
];

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-b from-black to-gray-950 border-t border-white/10">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      <div className="container-padding relative z-10">
        {/* Main Footer Content */}
        <div className="py-20 grid lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#home" className="flex items-center gap-2 mb-6">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg opacity-80" />
                <Shield className="relative z-10 w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-sora bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Grow with Us
              </span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              We don't just manage social media. We grow your business with AI-powered digital marketing strategies that deliver real results.
            </p>
            <p className="text-sm text-white font-semibold font-sora mb-2">
              Grow Your Business With
            </p>
            <p className="text-blue-400 text-sm font-semibold font-sora">
              Smart Digital Solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <a
                    href={service.href}
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-sm"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Socials */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-6">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get marketing tips and insights delivered to your inbox.
            </p>
            <div className="flex gap-2 mb-6">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors duration-300 text-sm"
              />
              <button className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors duration-300">
                <Mail className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-sm text-gray-400 mb-4">Follow us</p>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Grow with Us. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">
              Terms & Conditions
            </a>
            <button
              onClick={scrollToTop}
              className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors duration-300"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
