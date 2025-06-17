import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectWallet from '../Web3/ConnectWallet';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Deposit', href: '/deposit' },
    { name: 'Borrow', href: '/borrow' },
    { name: 'Passport', href: '/passport' },
    { name: 'Swap', href: '/swap' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 cyber-glass border-b border-cyber-500/20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 bg-gradient-cyber rounded-lg flex items-center justify-center shadow-cyber group-hover:shadow-glow-md transition-all duration-300"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="w-6 h-6 text-black" />
            </motion.div>
            <motion.span
              className="text-2xl font-bold font-orbitron neon-text bg-gradient-cyber bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              CrossCredit
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-orbitron ${
                    isActive(item.href)
                      ? 'bg-cyber-500/20 text-cyber-300 border border-cyber-500/50 shadow-glow-sm'
                      : 'text-gray-300 hover:text-cyber-300 hover:bg-cyber-500/10'
                  }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            <ConnectWallet />
          </div>

          {/* Mobile menu button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-cyber-400 hover:text-cyber-300 hover:bg-cyber-500/10 transition-colors border border-cyber-500/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-cyber-500/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-2">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-orbitron block ${
                        isActive(item.href)
                          ? 'bg-cyber-500/20 text-cyber-300 border border-cyber-500/50'
                          : 'text-gray-300 hover:text-cyber-300 hover:bg-cyber-500/10'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-cyber-500/20 mt-4 flex items-center justify-between">
                  <ConnectWallet />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;