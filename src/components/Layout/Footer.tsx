import React from 'react';
import { Github, Twitter, MessageCircle, ExternalLink, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Discord', icon: MessageCircle, href: '#' },
  ];

  const footerLinks = [
    {
      title: 'Protocol',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'Whitepaper', href: '#' },
        { name: 'Security', href: '#' },
        { name: 'Bug Bounty', href: '#' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Discord', href: '#' },
        { name: 'Twitter', href: '#' },
        { name: 'Forum', href: '#' },
        { name: 'Blog', href: '#' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { name: 'API Docs', href: '#' },
        { name: 'SDK', href: '#' },
        { name: 'Smart Contracts', href: '#' },
        { name: 'GitHub', href: '#' },
      ],
    },
  ];

  return (
    <footer className="cyber-glass border-t border-cyber-500/20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid-bg opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-cyber rounded-lg flex items-center justify-center shadow-cyber">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-bold font-orbitron neon-text bg-gradient-cyber bg-clip-text text-transparent">
                CrossCredit
              </span>
            </div>
            <p className="text-cyber-300 text-sm mb-6 leading-relaxed">
              The next-generation cross-chain DeFi protocol with AI-powered credit scoring and immersive Web3 experiences.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  className="p-3 rounded-lg cyber-glass text-cyber-400 hover:text-white hover:bg-cyber-500/20 transition-all duration-300 border border-cyber-500/30"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          {footerLinks.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              className="col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (sectionIndex + 1) * 0.1 }}
            >
              <h3 className="text-white font-semibold mb-4 font-orbitron neon-text">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIndex + 1) * 0.1 + linkIndex * 0.05 }}
                  >
                    <a
                      href={link.href}
                      className="text-cyber-400 hover:text-white transition-colors duration-200 text-sm flex items-center group font-mono"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="border-t border-cyber-500/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-cyber-400 text-sm font-mono">
            © 2025 CrossCredit Protocol. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-cyber-400 hover:text-white text-sm transition-colors font-mono">
              Privacy Policy
            </a>
            <a href="#" className="text-cyber-400 hover:text-white text-sm transition-colors font-mono">
              Terms of Service
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyber-500 opacity-30 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-cyber-500 opacity-30 animate-pulse"></div>
    </footer>
  );
};

export default Footer;