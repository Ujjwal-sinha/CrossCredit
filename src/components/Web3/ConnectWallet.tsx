import React, { useState } from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberButton from '../UI/CyberButton';

const ConnectWallet: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [address] = useState('0x1234...5678'); // Mock address
  const [balance] = useState('2.45 ETH'); // Mock balance

  const handleConnect = () => {
    // Mock connect functionality
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsDropdownOpen(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText('0x1234567890123456789012345678901234567890');
  };

  if (!isConnected) {
    return (
      <CyberButton
        onClick={handleConnect}
        icon={Wallet}
        variant="primary"
        glitch
      >
        Connect Wallet
      </CyberButton>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 px-4 py-2 cyber-glass text-white rounded-lg hover:bg-cyber-500/20 transition-all duration-300 border border-cyber-500/30 font-mono"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-matrix-400 rounded-full animate-pulse"></div>
          <span className="text-sm">{address}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-80 cyber-glass rounded-xl shadow-cyber border border-cyber-500/30 py-2 z-50"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-cyber-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-cyber rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-xs text-cyber-400 uppercase tracking-wide font-orbitron">Connected Wallet</p>
                  <p className="font-mono text-sm text-white">{address}</p>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="px-4 py-3 border-b border-cyber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-cyber-400 text-sm">Balance</span>
                <span className="text-white font-mono font-bold">{balance}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="py-2">
              <button
                onClick={copyAddress}
                className="w-full px-4 py-2 text-left hover:bg-cyber-500/10 transition-colors flex items-center space-x-3 text-cyber-300 hover:text-white"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy Address</span>
              </button>
              
              <a
                href="#"
                className="w-full px-4 py-2 text-left hover:bg-cyber-500/10 transition-colors flex items-center space-x-3 text-cyber-300 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">View on Explorer</span>
              </a>
            </div>
            
            <div className="border-t border-cyber-500/20 pt-2">
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 text-left hover:bg-red-500/10 transition-colors flex items-center space-x-3 text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectWallet;