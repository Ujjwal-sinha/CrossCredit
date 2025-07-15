
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Zap, Send, ArrowDownRight, RefreshCw, Shield, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import CyberCard from '../components/UI/CyberCard';
import CyberButton from '../components/UI/CyberButton';
import GradientButton from '../components/UI/GradientButton';
import { useWallet } from '../hooks/useWallet';
import { BLOCKDAG_CONFIG } from '../config/blockdag';
import { CROSS_CREDIT_TOKEN_ABI } from '../abi/CrossCreditToken';
import { BLOCKDAG_ROUTER_ABI } from '../abi/BlockDAGRouter';

const BlockDAGDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [targetChain, setTargetChain] = useState('1'); // Ethereum
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contractData, setContractData] = useState({
    tokenName: '',
    tokenSymbol: '',
    totalSupply: '0',
    minTransfer: '0',
    maxTransfer: '0',
  });

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

  useEffect(() => {
    if (isConnected && address) {
      loadContractData();
      loadBalance();
    }
  }, [isConnected, address]);

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
        BLOCKDAG_CONFIG.contracts.CrossCreditToken,
        CROSS_CREDIT_TOKEN_ABI,
        signer
      );
    }
    
    return new ethers.Contract(
      BLOCKDAG_CONFIG.contracts.CrossCreditToken,
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
        BLOCKDAG_CONFIG.contracts.BlockDAGRouter,
        BLOCKDAG_ROUTER_ABI,
        signer
      );
    }
    
    return new ethers.Contract(
      BLOCKDAG_CONFIG.contracts.BlockDAGRouter,
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

  const loadBalance = async () => {
    if (!address) return;
    
    try {
      const tokenContract = await getTokenContract();
      if (!tokenContract) return;

      const balance = await tokenContract.balanceOf(address);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error loading balance:', error);
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
      
      await loadBalance();
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
        BLOCKDAG_CONFIG.contracts.BlockDAGRouter,
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
      
      await loadBalance();
      setTransferAmount('');
      setTransferTo('');
    } catch (error: any) {
      console.error('Cross-chain transfer failed:', error);
      alert('Cross-chain transfer failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <CyberCard title="Connect Wallet" icon={Shield} glowing>
            <p className="text-cyber-400 mb-6">
              Please connect your wallet to access BlockDAG features.
            </p>
            <p className="text-cyber-300 text-sm">
              Make sure you're connected to BlockDAG Testnet (Chain ID: 1043)
            </p>
          </CyberCard>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4 font-orbitron">
            BlockDAG Cross-Chain Dashboard
          </h1>
          <p className="text-cyber-400 font-mono">
            Test lending, receiving, and transfer functions on BlockDAG testnet
          </p>
        </motion.div>

        {/* Contract Info */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CyberCard title="Token Info" icon={Activity} glowing>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-cyber-400">Name:</span>
                <span className="text-white font-mono">{contractData.tokenName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-400">Symbol:</span>
                <span className="text-white font-mono">{contractData.tokenSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-400">Total Supply:</span>
                <span className="text-white font-mono">{Number(contractData.totalSupply).toLocaleString()}</span>
              </div>
            </div>
          </CyberCard>

          <CyberCard title="Your Balance" icon={Shield} glowing>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyber-300 font-orbitron mb-2">
                {Number(balance).toFixed(4)}
              </div>
              <div className="text-cyber-400 text-sm font-mono">{contractData.tokenSymbol}</div>
              <CyberButton
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={loadBalance}
                icon={RefreshCw}
              >
                Refresh
              </CyberButton>
            </div>
          </CyberCard>

          <CyberCard title="Transfer Limits" icon={Zap} glowing>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-cyber-400">Min:</span>
                <span className="text-white font-mono">{contractData.minTransfer} XCC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyber-400">Max:</span>
                <span className="text-white font-mono">{Number(contractData.maxTransfer).toLocaleString()} XCC</span>
              </div>
            </div>
          </CyberCard>
        </motion.div>

        {/* Transfer Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regular Transfer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CyberCard title="Regular Transfer" icon={Send} glowing>
              <div className="space-y-4">
                <div>
                  <label className="block text-cyber-400 text-sm mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 text-sm mb-2">Amount (XCC)</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <GradientButton
                  size="lg"
                  className="w-full"
                  disabled={!transferAmount || !transferTo || loading}
                  onClick={handleTransfer}
                >
                  {loading ? 'Transferring...' : 'Transfer Tokens'}
                </GradientButton>
              </div>
            </CyberCard>
          </motion.div>

          {/* Cross-Chain Transfer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CyberCard title="Cross-Chain Transfer" icon={ArrowDownRight} glowing>
              <div className="space-y-4">
                <div>
                  <label className="block text-cyber-400 text-sm mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 text-sm mb-2">Amount (XCC)</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 text-sm mb-2">Target Chain</label>
                  <select
                    value={targetChain}
                    onChange={(e) => setTargetChain(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-gray-700 rounded-lg text-white"
                  >
                    {supportedChains.map((chain) => (
                      <option key={chain.id} value={chain.id} className="bg-gray-800">
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
                <GradientButton
                  size="lg"
                  className="w-full"
                  disabled={!transferAmount || !transferTo || loading}
                  onClick={handleCrossChainTransfer}
                >
                  {loading ? 'Processing...' : 'Cross-Chain Transfer'}
                </GradientButton>
              </div>
            </CyberCard>
          </motion.div>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CyberCard title="Transaction Successful" icon={Activity} glowing>
              <div className="text-center">
                <p className="text-matrix-400 mb-4">Transaction completed successfully!</p>
                <a
                  href={`${BLOCKDAG_CONFIG.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-400 hover:text-cyber-300 font-mono text-sm break-all"
                >
                  {txHash}
                </a>
              </div>
            </CyberCard>
          </motion.div>
        )}

        {/* Contract Addresses */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CyberCard title="Contract Addresses" icon={Shield} glowing>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-cyber-400 text-sm mb-2">CrossCreditToken</label>
                <div className="p-3 bg-white/5 border border-gray-700 rounded-lg">
                  <code className="text-cyber-300 text-sm font-mono break-all">
                    {BLOCKDAG_CONFIG.contracts.CrossCreditToken}
                  </code>
                </div>
              </div>
              <div>
                <label className="block text-cyber-400 text-sm mb-2">BlockDAGRouter</label>
                <div className="p-3 bg-white/5 border border-gray-700 rounded-lg">
                  <code className="text-cyber-300 text-sm font-mono break-all">
                    {BLOCKDAG_CONFIG.contracts.BlockDAGRouter}
                  </code>
                </div>
              </div>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </div>
  );
};

export default BlockDAGDashboard;
