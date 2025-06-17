// Add ethereum to the Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: string | null;
  error: string | null;
}

const initialState: WalletState = {
  isConnecting: false,
  isConnected: false,
  address: null,
  balance: null,
  chainId: null,
  error: null,
};

export const useWallet = () => {
  const [state, setState] = useState<WalletState>(initialState);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const updateState = useCallback((updates: Partial<WalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchBalance = useCallback(async (address: string) => {
    if (!window.ethereum || !address) return null;

    try {
      const [balance] = await Promise.all([
        window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        })
      ]);
      
      if (!balance) return null;
      const ethBalance = parseFloat((parseInt(balance, 16) / 1e18).toFixed(4));
      return `${ethBalance} ETH`;
    } catch {
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      updateState({
        error: 'MetaMask not installed',
        isConnected: false,
        isConnecting: false
      });
      return;
    }

    if (window.ethereum.selectedAddress) {
      // Already connected, just update state
      updateState({
        isConnected: true,
        address: window.ethereum.selectedAddress,
        chainId: window.ethereum.chainId || null,
        error: null
      });
      return;
    }

    updateState({ isConnecting: true, error: null });

    try {
      // Fast check for existing permissions
      const permissions = await window.ethereum.request({
        method: 'wallet_getPermissions'
      }).catch(() => []);

      // If already have permissions, use eth_accounts (faster) instead of eth_requestAccounts
      const method = permissions.length > 0 ? 'eth_accounts' : 'eth_requestAccounts';
      
      const accounts = await window.ethereum.request({ method });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const address = accounts[0];
      
      // Immediate update for fast UI response
      updateState({
        isConnected: true,
        address,
        chainId: window.ethereum.chainId || null,
        error: null,
        isConnecting: false
      });

      // Background balance fetch
      fetchBalance(address)
        .then(balance => {
          if (balance) updateState({ balance });
        })
        .catch(() => {}); // Ignore balance fetch errors

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      updateState({
        error: error?.message || 'Failed to connect wallet',
        isConnected: false
      });
    } finally {
      updateState({ isConnecting: false });
    }
  }, [fetchBalance, updateState]);

  const disconnect = useCallback(() => {
    resetState();
  }, [resetState]);

  // Initialize wallet state
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      // Fast check using selectedAddress
      if (window.ethereum.selectedAddress) {
        const address = window.ethereum.selectedAddress;
        updateState({
          isConnected: true,
          address,
          chainId: window.ethereum.chainId || null
        });

        // Background balance fetch
        fetchBalance(address)
          .then(balance => {
            if (balance) updateState({ balance });
          })
          .catch(() => {}); // Ignore balance fetch errors
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts?.length > 0) {
          const address = accounts[0];
          updateState({
            isConnected: true,
            address,
            chainId: window.ethereum.chainId || null
          });

          // Background balance fetch
          fetchBalance(address)
            .then(balance => {
              if (balance) updateState({ balance });
            })
            .catch(() => {}); // Ignore balance fetch errors
        }
      } catch {
        // Ignore errors during initial check
      }
    };

    checkConnection();
  }, [fetchBalance, updateState]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        resetState();
      } else {
        const address = accounts[0];
        const balance = await fetchBalance(address);
        updateState({
          isConnected: true,
          address,
          balance
        });
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleDisconnect = () => {
      resetState();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [resetState, fetchBalance, updateState]);

  return {
    ...state,
    connect,
    disconnect,
    updateBalance: async () => {
      if (state.address) {
        const balance = await fetchBalance(state.address);
        updateState({ balance });
      }
    }
  };
};
