import React from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberButton from '../UI/CyberButton';
import { useWallet } from '../../hooks/useWallet';
import { getChainInfo, getExplorerUrl } from '../../utils/chains';

const ConnectWallet: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const {
    isConnecting,
    isConnected,
    address,
    balance,
    chainId,
    error,
    connect,
    disconnect
  } = useWallet();

  const copyAddress = React.useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  }, [address]);

  const chainInfo = React.useMemo(() => 
    chainId ? getChainInfo(chainId) : null, 
    [chainId]
  );

  const explorerUrl = React.useMemo(() => 
    chainId && address ? getExplorerUrl(chainId, address) : '#',
    [chainId, address]
  );

  if (!isConnected) {
    return (
      <div className="relative inline-block">
        <CyberButton
          onClick={connect}
          icon={Wallet}
          variant="primary"
          glitch
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </CyberButton>
        {error && (
          <div className="absolute top-full left-0 mt-2 text-red-400 text-xs whitespace-nowrap">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 px-4 py-2 cyber-glass text-white rounded-lg hover:bg-cyber-500/20 transition-all duration-300 border border-cyber-500/30 font-mono"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-matrix-400 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {chainInfo && (
            <span className="text-xs text-cyber-400">{chainInfo.name}</span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-cyber rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-xs text-cyber-400 uppercase tracking-wide font-orbitron">
                      Connected Wallet
                    </p>
                    <p className="font-mono text-sm text-white break-all">
                      {address}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    disconnect();
                  }}
                  className="ml-2 p-1 rounded hover:bg-red-500/20 transition-colors"
                  title="Disconnect"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Network & Balance */}
            <div className="px-4 py-3 border-b border-cyber-500/20 space-y-2">
              {chainInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-cyber-400 text-sm">Network</span>
                  <span className="text-white font-mono font-bold">
                    {chainInfo.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-cyber-400 text-sm">Balance</span>
                <span className="text-white font-mono font-bold">
                  {balance || '...'}
                </span>
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
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 text-left hover:bg-cyber-500/10 transition-colors flex items-center space-x-3 text-cyber-300 hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">View on Explorer</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectWallet;