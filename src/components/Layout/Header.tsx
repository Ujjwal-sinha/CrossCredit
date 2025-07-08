import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@civic/auth-web3/react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn, signOut } = useUser();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Deposit', href: '/deposit' },
    { name: 'Borrow', href: '/borrow' },
    { name: 'Passport', href: '/passport' },
    { name: 'Swap', href: '/swap' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Monitor authentication state changes and redirect if authenticated
  useEffect(() => {
    console.log('Header: Auth state updated', { user, isAuthenticated, location: location.pathname });
    if (user && isAuthenticated && location.pathname === '/') {
      console.log('Header: User authenticated, redirecting to /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthenticated, location.pathname, navigate]);

  // Auth button handlers with processing state
  const handleSignIn = async () => {
    setProcessing(true);
    console.time('CivicSignIn');
    try {
      await signIn();
      console.log('Header: Sign-in successful, navigating to /dashboard');
      navigate('/dashboard', { replace: true }); // Navigate after successful sign-in
    } catch (error) {
      console.error('Header: Sign-in error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      console.timeEnd('CivicSignIn');
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    setProcessing(true);
    try {
      await signOut();
      console.log('Header: Sign-out successful');
      navigate('/', { replace: true }); // Navigate to landing page after sign-out
    } catch (error) {
      console.error('Header: Sign-out error:', error);
      alert('Sign-out failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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
                  onClick={(e) => {
                    if (processing) {
                      e.preventDefault(); // Prevent navigation during processing
                      console.log('Header: Navigation blocked due to processing');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-orbitron ${
                    isActive(item.href)
                      ? 'bg-cyber-500/20 text-cyber-300 border border-cyber-500/50 shadow-glow-sm'
                      : `text-gray-300 hover:text-cyber-300 hover:bg-cyber-500/10 ${
                          processing ? 'pointer-events-none opacity-50' : ''
                        }`
                  }`}
                >
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 rounded-lg bg-cyber-500 text-black font-orbitron font-bold shadow-cyber hover:bg-cyber-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Sign into CrossCredit'
                )}
              </button>
            )}
            {user && (
              <>
                <span className="text-cyber-300 font-orbitron text-sm mr-2">
                  {String(user.displayName || user.email || user.address)}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-cyber-500 text-black font-orbitron font-bold shadow-cyber hover:bg-cyber-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                  disabled={processing}
                >
                  {processing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Sign out'
                  )}
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-cyber-400 hover:text-cyber-300 hover:bg-cyber-500/10 transition-colors border border-cyber-500/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                      onClick={(e) => {
                        if (processing) {
                          e.preventDefault();
                          console.log('Header: Mobile navigation blocked due to processing');
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-orbitron block ${
                        isActive(item.href)
                          ? 'bg-cyber-500/20 text-cyber-300 border border-cyber-500/50'
                          : `text-gray-300 hover:text-cyber-300 hover:bg-cyber-500/10 ${
                              processing ? 'pointer-events-none opacity-50' : ''
                            }`
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-cyber-500/20 mt-4 flex items-center justify-between">
                  {!user && (
                    <button
                      onClick={handleSignIn}
                      className="w-full px-4 py-2 rounded-lg bg-cyber-500 text-black font-orbitron font-bold shadow-cyber hover:bg-cyber-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                      disabled={processing}
                    >
                      {processing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Sign into CrossCredit'
                      )}
                    </button>
                  )}
                  {user && (
                    <>
                      <span className="text-cyber-300 font-orbitron text-sm mr-2">
                        {String(user.displayName || user.email || user.address)}
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 rounded-lg bg-cyber-500 text-black font-orbitron font-bold shadow-cyber hover:bg-cyber-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                        disabled={processing}
                      >
                        {processing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Sign out'
                        )}
                      </button>
                    </>
                  )}
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