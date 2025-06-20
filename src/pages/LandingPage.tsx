import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  TrendingUp, 
  Award, 
  Users,
  ChevronRight,
  Star,
  ExternalLink,
  Coins,
  Network,
  CreditCard,
  Fingerprint,
  Brain,
  Layers,
  Lock
} from 'lucide-react';
import CyberButton from '../components/UI/CyberButton';
import StatCard from '../components/UI/StatCard';
import CyberCard from '../components/UI/CyberCard';
import NetworkVisualization from '../components/3D/NetworkVisualization';

const LandingPage: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  const [typedText, setTypedText] = useState('');
  const fullText = 'Next-Gen Cross-Chain DeFi Protocol';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Network,
      title: 'Cross-Chain Lending',
      description: 'Deposit collateral on one blockchain and borrow on another. Seamlessly bridge assets across multiple chains with CCIP technology.',
      gradient: 'from-cyber-500 to-neon-500',
    },
    {
      icon: Brain,
      title: 'AI Credit Scoring',
      description: 'Get personalized credit scores based on your DeFi activity, transaction history, and on-chain behavior patterns.',
      gradient: 'from-matrix-500 to-cyber-500',
    },
    {
      icon: Award,
      title: 'DeFi Passport NFT',
      description: 'Mint your unique DeFi Passport NFT that showcases your credit worthiness and reputation in the ecosystem.',
      gradient: 'from-neon-500 to-matrix-500',
    },
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Built with Chainlink CCIP for secure cross-chain messaging and audited smart contracts for maximum security.',
      gradient: 'from-cyber-500 to-neon-500',
    },
  ];

  const stats = [
    { title: 'Total Value Locked', value: '$12.5M', icon: Coins, change: '+24.5%', changeType: 'positive' as const },
    { title: 'Active Users', value: '2,847', icon: Users, change: '+18.2%', changeType: 'positive' as const },
    { title: 'Chains Supported', value: '5', icon: Globe, change: '+2', changeType: 'positive' as const },
    { title: 'Credit Scores Issued', value: '1,203', icon: CreditCard, change: '+156', changeType: 'positive' as const },
  ];

  const supportedChains = [
    { name: 'Ethereum', logo: '🔹', color: '#627eea' },
    { name: 'Arbitrum', logo: '🔺', color: '#28a0f0' },
    { name: 'Polygon', logo: '🟣', color: '#8247e5' },
    { name: 'Avalanche', logo: '🔴', color: '#e84142' },
    { name: 'Optimism', logo: '🔴', color: '#ff0420' },
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'DeFi Trader',
      content: 'CrossCredit transformed how I manage my portfolio. The cross-chain functionality is seamless and the UI is incredible!',
      rating: 5,
      avatar: '👨‍💻',
    },
    {
      name: 'Sarah Johnson',
      role: 'Yield Farmer',
      content: 'The AI credit scoring helped me access better rates. The DeFi Passport is a game-changer for the entire ecosystem.',
      rating: 5,
      avatar: '👩‍🌾',
    },
    {
      name: 'Michael Torres',
      role: 'Institutional Investor',
      content: 'Finally, a protocol that understands cross-chain capital efficiency. The 3D interface is mind-blowing.',
      rating: 5,
      avatar: '👨‍💼',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-white text-black dark:bg-black dark:text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <motion.div 
          className="max-w-7xl mx-auto w-full"
          style={{ y: y1, opacity }}
        >
          <div className="text-center">
            <motion.div
              className="inline-flex items-center px-6 py-3 cyber-glass text-cyber-300 rounded-full text-sm font-medium mb-8 border border-cyber-500/30 shadow-cyber"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Fingerprint className="w-5 h-5 mr-3 animate-pulse" />
              <span className="font-orbitron">Powered by AI & Chainlink CCIP</span>
            </motion.div>
            
            <motion.h1
              className="text-4xl sm:text-6xl lg:text-8xl font-bold text-white mb-6 leading-tight font-orbitron"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="block ">CrossCredit</span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl bg-gradient-cyber bg-clip-text text-transparent mt-4">
                {typedText}
                <span className="animate-pulse">|</span>
              </span>
            </motion.h1>
            
            <motion.p
              className="text-xl text-cyber-300 mb-12 max-w-4xl mx-auto leading-relaxed font-mono"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Experience the future of DeFi with cross-chain lending, AI-powered credit scoring, 
              and immersive 3D interfaces. Deposit on one chain, borrow on another.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              <Link to="/dashboard">
                <CyberButton size="lg" icon={ArrowRight} iconPosition="right" glitch>
                  Launch Protocol
                </CyberButton>
              </Link>
              <CyberButton variant="outline" size="lg" icon={ExternalLink}>
                Watch Demo
              </CyberButton>
            </motion.div>

            {/* Supported Chains */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-8 opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <span className="text-sm text-cyber-400 uppercase tracking-wide font-orbitron">
                Supported Networks
              </span>
              {supportedChains.map((chain, index) => (
                <motion.div
                  key={chain.name}
                  className="flex items-center space-x-2 cyber-glass px-4 py-2 rounded-lg border border-cyber-500/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-lg">{chain.logo}</span>
                  <span className="text-sm text-cyber-300 font-mono">{chain.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 border-2 border-cyber-500 rotate-45 opacity-30"
          animate={{ rotate: 405, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 border-2 border-neon-500 rounded-full opacity-20"
          animate={{ rotate: -360, scale: [1, 0.8, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-16 h-16 border-2 border-matrix-500 opacity-25"
          animate={{ rotate: 180, y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Network Visualization Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-orbitron neon-text">
              Cross-Chain Network
            </h2>
            <p className="text-xl text-cyber-300 max-w-3xl mx-auto mb-8 font-mono">
              Seamlessly connect and operate across multiple blockchains
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center mb-12">
            {supportedChains.map((chain) => (
              <motion.div
                key={chain.name}
                className="flex items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div 
                  className="p-4 rounded-lg cyber-glass border border-cyber-500/30 w-full text-center"
                  style={{ 
                    boxShadow: `0 0 20px ${chain.color}33`,
                    borderColor: `${chain.color}66`
                  }}
                >
                  <div className="text-2xl mb-2">{chain.logo}</div>
                  <div className="text-white font-orbitron">{chain.name}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative">
            <CyberCard className="max-w-4xl mx-auto">
              <div className="aspect-[16/9] w-full">
                <NetworkVisualization />
              </div>
              
              {/* Network Stats Overlay */}
              <div className="absolute top-4 left-4 cyber-glass p-4 rounded-lg border border-cyber-500/30 backdrop-blur-sm">
                <div className="text-xs text-cyber-400 uppercase mb-1 font-mono">Network Activity</div>
                <div className="flex space-x-6">
                  <div>
                    <div className="text-matrix-400 text-lg font-bold">5.2K</div>
                    <div className="text-xs text-cyber-300">Daily Txns</div>
                  </div>
                  <div>
                    <div className="text-neon-400 text-lg font-bold">$2.8M</div>
                    <div className="text-xs text-cyber-300">24h Volume</div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 cyber-glass p-4 rounded-lg border border-cyber-500/30 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  {[
                    { color: '#627eea', label: 'ETH Network' },
                    { color: '#8247e5', label: 'MATIC Network' },
                    { color: '#e84142', label: 'AVAX Network' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-cyber-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CyberCard>

            {/* Pulse Effects */}
            <div className="absolute -inset-4 bg-gradient-radial from-matrix-500/20 to-transparent animate-pulse-slow pointer-events-none" />
          </div>

        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-orbitron neon-text">
              Revolutionary DeFi Features
            </h2>
            <p className="text-xl text-cyber-300 max-w-3xl mx-auto font-mono">
              Experience the future of decentralized finance with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <CyberCard glowing animated>
                  <div className="flex items-start space-x-4">
                    <div className={`p-4 bg-gradient-to-r ${feature.gradient} rounded-lg shadow-glow-md`}>
                      <feature.icon className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3 font-orbitron neon-text">
                        {feature.title}
                      </h3>
                      <p className="text-cyber-300 leading-relaxed font-mono">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CyberCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-orbitron neon-text">
              How It Works
            </h2>
            <p className="text-xl text-cyber-300 font-mono">
              Simple steps to start your cross-chain DeFi journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Deposit Collateral',
                description: 'Deposit your tokens on any supported blockchain as collateral',
                icon: Coins,
              },
              {
                step: '02',
                title: 'Get Credit Score',
                description: 'Our AI analyzes your DeFi activity to generate your credit score',
                icon: TrendingUp,
              },
              {
                step: '03',
                title: 'Borrow & Mint NFT',
                description: 'Borrow on another chain and mint your DeFi Passport NFT',
                icon: Award,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <CyberCard glowing>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-cyber rounded-full flex items-center justify-center mb-6 shadow-cyber">
                      <item.icon className="w-10 h-10 text-black" />
                    </div>
                    <div className="text-sm font-mono text-cyber-400 mb-2 font-orbitron">{item.step}</div>
                    <h3 className="text-xl font-semibold text-white mb-4 font-orbitron neon-text">{item.title}</h3>
                    <p className="text-cyber-300 font-mono">{item.description}</p>
                  </div>
                </CyberCard>
                
                {/* Connection lines */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-cyber"></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-orbitron neon-text">
              What Users Say
            </h2>
            <p className="text-xl text-cyber-300 font-mono">
              Join thousands of satisfied users already using CrossCredit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <CyberCard glowing>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-cyber-300 mb-6 italic font-mono">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-white font-orbitron">{testimonial.name}</div>
                      <div className="text-sm text-cyber-400 font-mono">{testimonial.role}</div>
                    </div>
                  </div>
                </CyberCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <CyberCard glowing className="p-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 font-orbitron neon-text">
              Ready to Enter the Future?
            </h2>
            <p className="text-xl text-cyber-300 mb-8 font-mono">
              Join the next generation of DeFi and unlock unlimited cross-chain possibilities
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/dashboard">
                <CyberButton size="lg" icon={ArrowRight} iconPosition="right" glitch>
                  Launch Protocol Now
                </CyberButton>
              </Link>
              <CyberButton variant="outline" size="lg" icon={ExternalLink}>
                Read Documentation
              </CyberButton>
            </div>
          </CyberCard>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;