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

    updateState({ isConnecting: true, error: null });

    try {
      // Always prompt MetaMask when user clicks connect
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const address = accounts[0];
      let balance = null;
      try {
        balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        balance = balance ? `${parseFloat((parseInt(balance, 16) / 1e18).toFixed(4))} ETH` : null;
      } catch (err) {
        console.error('Error fetching initial balance:', err);
      }

      updateState({
        isConnected: true,
        address,
        chainId: window.ethereum.chainId || null,
        balance,
        error: null,
        isConnecting: false
      });
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
        let balance = null;
        
        try {
          const balanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          });
          balance = balanceHex ? `${parseFloat((parseInt(balanceHex, 16) / 1e18).toFixed(4))} ETH` : null;
        } catch (err) {
          console.error('Error fetching initial balance:', err);
        }

        updateState({
          isConnected: true,
          address,
          chainId: window.ethereum.chainId || null,
          balance
        });
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts?.length > 0) {
          const address = accounts[0];
          let balance = null;
          
          try {
            const balanceHex = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest'],
            });
            balance = balanceHex ? `${parseFloat((parseInt(balanceHex, 16) / 1e18).toFixed(4))} ETH` : null;
          } catch (err) {
            console.error('Error fetching initial balance:', err);
          }

          updateState({
            isConnected: true,
            address,
            chainId: window.ethereum.chainId || null,
            balance
          });
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
