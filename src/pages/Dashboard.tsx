import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Shield, Award, Plus, ArrowUpRight, ArrowDownRight, Zap, Activity, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/UI/StatCard';
import CyberButton from '../components/UI/CyberButton';
import CyberCard from '../components/UI/CyberCard';
import ConnectWallet from '../components/Web3/ConnectWallet';


const Dashboard: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-orbitron ">
              Command Center
            </h1>
            <p className="text-cyber-400 font-mono">Manage your cross-chain DeFi portfolio</p>
          </div>
          <div className="flex space-x-4 mt-4 lg:mt-0 items-center">
            <ConnectWallet />
            <Link to="/deposit">
              <CyberButton icon={Plus} glitch>Deposit</CyberButton>
            </Link>
            <Link to="/borrow">
              <CyberButton variant="outline" icon={ArrowDownRight}>Borrow</CyberButton>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Total Deposited"
              value="$25,430"
              icon={DollarSign}
              change="+12.5%"
              changeType="positive"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Total Borrowed"
              value="$18,750"
              icon={TrendingUp}
              change="+8.2%"
              changeType="positive"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Health Factor"
              value="2.35"
              icon={Shield}
              change="Safe"
              changeType="positive"
              description="Above 1.5 is healthy"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Credit Score"
              value="785"
              icon={Award}
              change="+15"
              changeType="positive"
              description="Excellent rating"
            />
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Overview */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <CyberCard title="Portfolio Overview" icon={Activity} glowing>
              <div className="space-y-4">
                {[
                  { 
                    token: 'ETH', 
                    name: 'Ethereum', 
                    chain: 'Arbitrum', 
                    amount: '$15,430', 
                    change: '+5.2%',
                    color: 'bg-blue-500',
                    chainColor: 'text-blue-400'
                  },
                  { 
                    token: 'USDC', 
                    name: 'USD Coin', 
                    chain: 'Polygon', 
                    amount: '$10,000', 
                    change: 'Stable',
                    color: 'bg-green-500',
                    chainColor: 'text-purple-400'
                  },
                  { 
                    token: 'AVAX', 
                    name: 'Avalanche', 
                    chain: 'Avalanche', 
                    amount: '$8,750', 
                    change: '+12.8%',
                    color: 'bg-red-500',
                    chainColor: 'text-red-400'
                  },
                ].map((asset, index) => (
                  <motion.div
                    key={asset.token}
                    className="flex items-center justify-between p-4 cyber-glass rounded-lg border border-cyber-500/30 hover:border-cyber-500/50 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${asset.color} rounded-full flex items-center justify-center shadow-glow-sm`}>
                        <span className="text-white text-sm font-bold font-orbitron">{asset.token}</span>
                      </div>
                      <div>
                        <div className="text-white font-medium font-orbitron">{asset.name}</div>
                        <div className={`text-sm font-mono ${asset.chainColor}`}>{asset.chain}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium font-mono">{asset.amount}</div>
                      <div className={`text-sm font-mono ${
                        asset.change.includes('+') ? 'text-matrix-400' : 
                        asset.change.includes('-') ? 'text-red-400' : 'text-cyber-400'
                      }`}>
                        {asset.change}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>

            {/* Recent Activity */}
            <motion.div className="mt-8" variants={itemVariants}>
              <CyberCard title="Recent Activity" icon={Activity} glowing>
                <div className="space-y-4">
                  {[
                    { type: 'deposit', amount: '$5,000 ETH', chain: 'Arbitrum', time: '2 hours ago', icon: ArrowUpRight, color: 'text-matrix-400' },
                    { type: 'borrow', amount: '$3,500 DSC', chain: 'Polygon', time: '1 day ago', icon: ArrowDownRight, color: 'text-cyber-400' },
                    { type: 'repay', amount: '$1,200 DSC', chain: 'Polygon', time: '3 days ago', icon: ArrowUpRight, color: 'text-neon-400' },
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-cyber-500/5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-cyber-500/30"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg cyber-glass border border-cyber-500/30 ${activity.color}`}>
                          <activity.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium capitalize font-orbitron">{activity.type}</div>
                          <div className="text-cyber-400 text-sm font-mono">{activity.chain}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">{activity.amount}</div>
                        <div className="text-cyber-400 text-sm font-mono">{activity.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CyberCard>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div className="space-y-8" variants={itemVariants}>
            {/* DeFi Passport */}
            <CyberCard title="DeFi Passport" icon={Award} glowing>
              <div className="text-center">
                <motion.div
                  className="bg-gradient-cyber rounded-lg p-6 mb-4 shadow-cyber"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Award className="w-16 h-16 text-black mx-auto mb-3" />
                  <div className="text-black font-bold text-2xl font-orbitron">785</div>
                  <div className="text-black/80 text-sm font-mono">Credit Score</div>
                  <div className="text-black font-medium font-orbitron">Excellent</div>
                </motion.div>
                <Link to="/passport">
                  <CyberButton variant="outline" className="w-full">
                    View Passport
                  </CyberButton>
                </Link>
              </div>
            </CyberCard>

            {/* Quick Actions */}
            <CyberCard title="Quick Actions" icon={Zap} glowing>
              <div className="space-y-3">
                {[
                  { name: 'Deposit Collateral', href: '/deposit', icon: Plus },
                  { name: 'Borrow DSC', href: '/borrow', icon: ArrowDownRight },
                  { name: 'Cross-Chain Swap', href: '/swap', icon: Target },
                  { name: 'Repay Loan', href: '/repay', icon: ArrowUpRight },
                ].map((action, index) => (
                  <Link key={action.name} to={action.href}>
                    <motion.button
                      className="w-full p-3 text-left hover:bg-cyber-500/10 rounded-lg transition-all duration-300 text-cyber-300 hover:text-white border border-transparent hover:border-cyber-500/30 flex items-center space-x-3 font-mono"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.name}</span>
                    </motion.button>
                  </Link>
                ))}
              </div>
            </CyberCard>

            {/* Network Status */}
            <CyberCard title="Network Status" icon={Activity} glowing>
              <div className="space-y-3">
                {[
                  { name: 'Ethereum', status: 'Online', latency: '12ms', color: 'text-matrix-400' },
                  { name: 'Arbitrum', status: 'Online', latency: '8ms', color: 'text-matrix-400' },
                  { name: 'Polygon', status: 'Online', latency: '15ms', color: 'text-matrix-400' },
                  { name: 'Avalanche', status: 'Online', latency: '10ms', color: 'text-matrix-400' },
                ].map((network, index) => (
                  <motion.div
                    key={network.name}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-cyber-500/5 transition-colors"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${network.color} animate-pulse`}></div>
                      <span className="text-white text-sm font-mono">{network.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${network.color} font-mono`}>{network.status}</div>
                      <div className="text-xs text-cyber-400 font-mono">{network.latency}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;