import React, { useState } from 'react';
import { useContract } from '../utils/useContract';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { getContractAddress, getNetworkByChainId } from '../utils/addresses';
import GradientButton from '../components/UI/GradientButton';

const Borrow: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address, isConnected, chainId } = useWallet();
  const network = getNetworkByChainId(chainId as any);
  const minter = useContract('Minter');

  // Add testnet chain options
  const chains = [
    { id: 'arbitrum', name: 'Arbitrum', testnet: 'Arbitrum Sepolia' },
    { id: 'ethereum', name: 'Ethereum', testnet: 'Ethereum Sepolia' },
    { id: 'polygon', name: 'Polygon', testnet: 'Polygon Amoy' },
    { id: 'avalanche', name: 'Avalanche', testnet: 'Avalanche Fuji' },
  ];

  const handleBorrow = async () => {
    if (!minter || !isConnected || !address || !amount || !network) return;
    setLoading(true);
    setTxHash(null);
    try {
      const tx = await minter.mintDSC(address, ethers.parseUnits(amount, 18));
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err) {
      alert('Borrow failed: ' + (err as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Borrow DSC</h1>
        <p className="text-gray-400 mb-8">Borrow stablecoins on any supported network using your cross-chain collateral</p>
        <div className="glass-morphism rounded-xl p-12">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount to borrow"
            className="w-full p-4 mb-4 bg-white/5 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-500"
          />
          <GradientButton
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || loading || !isConnected}
            onClick={handleBorrow}
          >
            {loading ? 'Borrowing...' : `Borrow DSC`}
          </GradientButton>
          {txHash && (
            <div className="mt-4 text-green-400 text-center">
              Borrow successful! Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Borrow;