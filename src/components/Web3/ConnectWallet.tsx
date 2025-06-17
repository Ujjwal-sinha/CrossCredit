import React, { useState, useCallback, useEffect } from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberButton from '../UI/CyberButton';

// Add this type declaration at the top of the file
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: string | null;
  loading: {
    connection: boolean;
    balance: boolean;
  };
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
  loading: {
    connection: false,
    balance: false,
  },
  error: null,
};

const ConnectWallet: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Memoized state updates
  const updateWalletState = useCallback((updates: Partial<WalletState>) => {
    setWalletState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLoadingState = useCallback((key: keyof WalletState['loading'], value: boolean) => {
    setWalletState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }));
  }, []);

  // Fetch balance efficiently
  const fetchBalance = useCallback(async (address: string) => {
    if (!address || !window.ethereum) return;

    updateLoadingState('balance', true);
    try {
      const bal = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const ethBalance = parseFloat((parseInt(bal, 16) / 1e18).toFixed(4));
      updateWalletState({ balance: `${ethBalance} ETH` });
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      updateLoadingState('balance', false);
    }
  }, [updateWalletState, updateLoadingState]);

  // Handle connection
  const handleConnect = useCallback(async () => {
    if (!window.ethereum) {
      updateWalletState({
        error: 'Please install MetaMask to connect your wallet',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    updateLoadingState('connection', true);
    updateWalletState({ error: null });

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts?.[0]) throw new Error('No accounts found');

      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      updateWalletState({
        isConnected: true,
        address: accounts[0],
        chainId,
      });

      await fetchBalance(accounts[0]);
    } catch (err: any) {
      updateWalletState({
        error: err?.message || 'Failed to connect wallet',
        isConnected: false,
      });
    } finally {
      updateLoadingState('connection', false);
    }
  }, [fetchBalance, updateWalletState, updateLoadingState]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    setWalletState(initialState);
    setIsDropdownOpen(false);
  }, []);

  // Copy address
  const copyAddress = useCallback(() => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
    }
  }, [walletState.address]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnect();
      } else if (accounts[0] !== walletState.address) {
        updateWalletState({
          address: accounts[0],
          isConnected: true,
        });
        await fetchBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      updateWalletState({ chainId });
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletState.address, handleDisconnect, updateWalletState, fetchBalance]);

  // Check initial connection
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts?.[0]) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          updateWalletState({
            isConnected: true,
            address: accounts[0],
            chainId,
          });
          await fetchBalance(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking initial connection:', err);
      }
    };

    checkConnection();
  }, [fetchBalance, updateWalletState]);

  // Render connect button or connected state
  if (!walletState.isConnected) {
    return (
      <div className="relative">
        <CyberButton
          onClick={handleConnect}
          icon={Wallet}
          variant="primary"
          glitch
          disabled={walletState.loading.connection}
        >
          {walletState.loading.connection ? 'Connecting...' : 'Connect Wallet'}
        </CyberButton>
        {walletState.error && (
          <div className="absolute top-full left-0 mt-2 text-red-400 text-xs">
            {walletState.error}
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-matrix-400 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {walletState.address
              ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
              : ''}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDisconnect();
          }}
          className="ml-2 p-1 rounded hover:bg-red-500/20 transition-colors"
          title="Disconnect"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
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
            <div className="px-4 py-3 border-b border-cyber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-cyber rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-xs text-cyber-400 uppercase tracking-wide font-orbitron">
                    Connected Wallet
                  </p>
                  <p className="font-mono text-sm text-white">{walletState.address}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="ml-2 p-1 rounded hover:bg-red-500/20 transition-colors"
                title="Disconnect"
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-cyber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-cyber-400 text-sm">Balance</span>
                <span className="text-white font-mono font-bold">
                  {walletState.loading.balance ? (
                    <span className="text-cyber-400">Loading...</span>
                  ) : (
                    walletState.balance
                  )}
                </span>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={copyAddress}
                className="w-full px-4 py-2 text-left hover:bg-cyber-500/10 transition-colors flex items-center space-x-3 text-cyber-300 hover:text-white"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy Address</span>
              </button>

              <a
                href={`https://etherscan.io/address/${walletState.address}`}
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