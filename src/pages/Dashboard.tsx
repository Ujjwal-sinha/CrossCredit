import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Shield, Award, Plus, ArrowUpRight, ArrowDownRight, Zap, Activity, Target, Send, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import StatCard from '../components/UI/StatCard';
import CyberButton from '../components/UI/CyberButton';
import CyberCard from '../components/UI/CyberCard';
import ConnectWallet from '../components/Web3/ConnectWallet';
import GradientButton from '../components/UI/GradientButton';
import { useWallet } from '../hooks/useWallet';
import { CROSS_CREDIT_TOKEN_ABI } from '../abi/CrossCreditToken';

import { BLOCKDAG_ROUTER_ABI } from '../abi/BlockDAGRouter';


const Dashboard: React.FC = () => {
  const { address, isConnected, chainId } = useWallet();
  const [xccBalance, setXccBalance] = useState('0');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [targetChain, setTargetChain] = useState('1'); // Ethereum
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contractData, setContractData] = useState({
    tokenName: '',
    tokenSymbol: '',
    totalSupply: '0',
    minTransfer: '0',
    maxTransfer: '0',
  });

  const isBlockDAGNetwork = chainId === '0x413'; // BlockDAG testnet chain ID

  // Get contract addresses from environment variables
  const CROSS_CREDIT_TOKEN_ADDRESS = import.meta.env.VITE_CROSS_CREDIT_TOKEN_ADDRESS;
  const BLOCKDAG_ROUTER_ADDRESS = import.meta.env.VITE_BLOCKDAG_ROUTER_ADDRESS;

  const supportedChains = [
    { id: '1', name: 'Ethereum Mainnet' },
    { id: '11155111', name: 'Ethereum Sepolia' },
    { id: '137', name: 'Polygon Mainnet' },
    { id: '80001', name: 'Polygon Mumbai' },
    { id: '42161', name: 'Arbitrum One' },
    { id: '421613', name: 'Arbitrum Goerli' },
    { id: '10', name: 'Optimism' },
    { id: '420', name: 'Optimism Goerli' },
    { id: '43114', name: 'Avalanche C-Chain' },
    { id: '43113', name: 'Avalanche Fuji' },
  ];

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

  useEffect(() => {
    if (isConnected && address) {
      if (isBlockDAGNetwork) {
        loadContractData();
        loadXccBalance();
      } else {
        // Reset balance if not on BlockDAG network
        setXccBalance('0');
        setContractData({
          tokenName: '',
          tokenSymbol: '',
          totalSupply: '0',
          minTransfer: '0',
          maxTransfer: '0',
        });
      }
    }
  }, [isConnected, address, isBlockDAGNetwork]);

  const getProvider = () => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  };

  const getSigner = async () => {
    const provider = getProvider();
    if (!provider) return null;
    return await provider.getSigner();
  };

  const getTokenContract = async (withSigner = false) => {
    const provider = getProvider();
    if (!provider) return null;
    
    if (withSigner) {
      const signer = await getSigner();
      return new ethers.Contract(
        CROSS_CREDIT_TOKEN_ADDRESS,
        CROSS_CREDIT_TOKEN_ABI,
        signer
      );
    }
    
    return new ethers.Contract(
      CROSS_CREDIT_TOKEN_ADDRESS,
      CROSS_CREDIT_TOKEN_ABI,
      provider
    );
  };

  const getRouterContract = async (withSigner = false) => {
    const provider = getProvider();
    if (!provider) return null;
    
    if (withSigner) {
      const signer = await getSigner();
      return new ethers.Contract(
        BLOCKDAG_ROUTER_ADDRESS,
        BLOCKDAG_ROUTER_ABI,
        signer
      );
    }
    
    return new ethers.Contract(
      BLOCKDAG_ROUTER_ADDRESS,
      BLOCKDAG_ROUTER_ABI,
      provider
    );
  };

  const loadContractData = async () => {
    try {
      const tokenContract = await getTokenContract();
      const routerContract = await getRouterContract();
      
      if (!tokenContract || !routerContract) return;

      const [name, symbol, totalSupply, minTransfer, maxTransfer] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.totalSupply(),
        routerContract.MIN_TRANSFER_AMOUNT(),
        routerContract.MAX_TRANSFER_AMOUNT(),
      ]);

      setContractData({
        tokenName: name,
        tokenSymbol: symbol,
        totalSupply: ethers.formatEther(totalSupply),
        minTransfer: ethers.formatEther(minTransfer),
        maxTransfer: ethers.formatEther(maxTransfer),
      });
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  const loadXccBalance = async () => {
    if (!address) return;
    
    try {
      const tokenContract = await getTokenContract();
      if (!tokenContract) return;

      const balance = await tokenContract.balanceOf(address);
      setXccBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error loading XCC balance:', error);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || !address) return;
    
    setLoading(true);
    setTxHash(null);
    
    try {
      const tokenContract = await getTokenContract(true);
      if (!tokenContract) throw new Error('Contract not available');

      const amount = ethers.parseEther(transferAmount);
      const tx = await tokenContract.transfer(transferTo, amount);
      
      setTxHash(tx.hash);
      await tx.wait();
      
      await loadXccBalance();
      setTransferAmount('');
      setTransferTo('');
    } catch (error: any) {
      console.error('Transfer failed:', error);
      alert('Transfer failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCrossChainTransfer = async () => {
    if (!transferAmount || !transferTo || !address) return;
    
    setLoading(true);
    setTxHash(null);
    
    try {
      const routerContract = await getRouterContract(true);
      const tokenContract = await getTokenContract(true);
      
      if (!routerContract || !tokenContract) throw new Error('Contracts not available');

      const amount = ethers.parseEther(transferAmount);
      
      // First approve the router to spend tokens
      const approveTx = await tokenContract.approve(
        BLOCKDAG_ROUTER_ADDRESS,
        amount
      );
      await approveTx.wait();
      
      // Then initiate cross-chain transfer
      const tx = await routerContract.initiateCrossChainTransfer(
        transferTo,
        amount,
        targetChain
      );
      
      setTxHash(tx.hash);
      await tx.wait();
      
      await loadXccBalance();
      setTransferAmount('');
      setTransferTo('');
    } catch (error: any) {
      console.error('Cross-chain transfer failed:', error);
      alert('Cross-chain transfer failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Total Deposited"
              value={<span className="text-3xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">$25,430</span>}
              icon={DollarSign}
              change="+12.5%"
              changeType="positive"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Total Borrowed"
              value={<span className="text-3xl font-bold bg-gradient-cyber bg-clip-text text-transparent font-orbitron">$18,750</span>}
              icon={TrendingUp}
              change="+8.2%"
              changeType="positive"
            /> 
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="XCC Balance"
              value={
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-cyber-300 font-orbitron glow-cyber">
                    {isBlockDAGNetwork ? Number(xccBalance).toFixed(2) : '0.00'}
                  </span>
                  {isBlockDAGNetwork && (
                    <CyberButton
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={loadXccBalance}
                      icon={RefreshCw}
                    />
                  )}
                </div>
              }
              icon={Zap}
              change={contractData.tokenSymbol || "XCC"}
              changeType="neutral"
              description={isBlockDAGNetwork ? "CrossCredit Token" : "Switch to BlockDAG"}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Health Factor"
              value={<span className="text-3xl font-bold text-matrix-400 font-orbitron glow-matrix">2.35</span>}
              icon={Shield}
              change="Safe"
              changeType="positive"
              description="Above 1.5 is healthy"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Credit Score"
              value={<span className="text-3xl font-bold text-cyber-300 font-orbitron glow-cyber">785</span>}
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
                  ...(isBlockDAGNetwork ? [{ 
                    token: contractData.tokenSymbol || 'XCC', 
                    name: contractData.tokenName || 'CrossCredit Token', 
                    chain: 'BlockDAG', 
                    amount: `${Number(xccBalance).toFixed(2)} XCC`, 
                    change: 'Available',
                    color: 'bg-cyber-500',
                    chainColor: 'text-cyber-400'
                  }] : []),
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
            {/* BlockDAG Operations (only show if on BlockDAG network) */}
            {isBlockDAGNetwork && (
              <>
                {/* Contract Info */}
                <CyberCard title="BlockDAG Token Info" icon={Activity} glowing>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-cyber-400 text-sm">Name:</span>
                      <span className="text-white font-mono text-sm">{contractData.tokenName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-400 text-sm">Symbol:</span>
                      <span className="text-white font-mono text-sm">{contractData.tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-400 text-sm">Total Supply:</span>
                      <span className="text-white font-mono text-sm">{Number(contractData.totalSupply).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-400 text-sm">Min Transfer:</span>
                      <span className="text-white font-mono text-sm">{contractData.minTransfer} XCC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-400 text-sm">Max Transfer:</span>
                      <span className="text-white font-mono text-sm">{Number(contractData.maxTransfer).toLocaleString()} XCC</span>
                    </div>
                  </div>
                </CyberCard>

                {/* Regular Transfer */}
                <CyberCard title="Regular Transfer" icon={Send} glowing>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cyber-400 text-sm mb-2">Recipient Address</label>
                      <input
                        type="text"
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-cyber-400 text-sm mb-2">Amount (XCC)</label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                      />
                    </div>
                    <GradientButton
                      size="sm"
                      className="w-full"
                      disabled={!transferAmount || !transferTo || loading}
                      onClick={handleTransfer}
                    >
                      {loading ? 'Transferring...' : 'Transfer XCC'}
                    </GradientButton>
                  </div>
                </CyberCard>

                {/* Cross-Chain Transfer */}
                <CyberCard title="Cross-Chain Transfer" icon={Target} glowing>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cyber-400 text-sm mb-2">Recipient Address</label>
                      <input
                        type="text"
                        value={transferTo}
                        onChange={(e) => setTransferTo(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-cyber-400 text-sm mb-2">Amount (XCC)</label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-cyber-400 text-sm mb-2">Target Chain</label>
                      <select
                        value={targetChain}
                        onChange={(e) => setTargetChain(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white text-sm"
                      >
                        {supportedChains.map((chain) => (
                          <option key={chain.id} value={chain.id} className="bg-gray-800">
                            {chain.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <GradientButton
                      size="sm"
                      className="w-full"
                      disabled={!transferAmount || !transferTo || loading}
                      onClick={handleCrossChainTransfer}
                    >
                      {loading ? 'Processing...' : 'Cross-Chain Transfer'}
                    </GradientButton>
                  </div>
                </CyberCard>

                {/* Transaction Hash */}
                {txHash && (
                  <CyberCard title="Transaction Hash" icon={ExternalLink} glowing>
                    <div className="text-center">
                      <p className="text-matrix-400 mb-4 text-sm">Transaction completed successfully!</p>
                      <a
                        href={`https://primordial.bdagscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-400 hover:text-cyber-300 text-xs font-mono break-all"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </CyberCard>
                )}

                {/* Contract Addresses */}
                <CyberCard title="Contract Addresses" icon={Shield} glowing>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-cyber-400 text-xs mb-1">CrossCreditToken</label>
                      <div className="p-2 bg-white/5 border border-gray-700 rounded text-xs">
                        <code className="text-cyber-300 font-mono break-all">
                          {CROSS_CREDIT_TOKEN_ADDRESS}
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-cyber-400 text-xs mb-1">BlockDAGRouter</label>
                      <div className="p-2 bg-white/5 border border-gray-700 rounded text-xs">
                        <code className="text-cyber-300 font-mono break-all">
                          {BLOCKDAG_ROUTER_ADDRESS}
                        </code>
                      </div>
                    </div>
                  </div>
                </CyberCard>
              </>
            )}

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
                  ...(isBlockDAGNetwork ? [] : [{ name: 'Switch to BlockDAG', href: '/blockdag', icon: Zap }]),
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
                  { name: 'BlockDAG', status: isBlockDAGNetwork ? 'Connected' : 'Available', latency: '20ms', color: isBlockDAGNetwork ? 'text-cyber-400' : 'text-gray-400' },
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