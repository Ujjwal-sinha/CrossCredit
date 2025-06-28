import React, { useState } from 'react';
import { useContract } from '../utils/useContract';
import { useWallet } from '../hooks/useWallet';
import { getNetworkByChainId } from '../utils/addresses';
import GradientButton from '../components/UI/GradientButton';
import { ethers } from 'ethers';

const DEST_CHAIN_IDS: Record<'fuji' | 'sepolia' | 'amoy', number> = {
  fuji: 0xaa36a7,
  sepolia: 0x13882,
  amoy: 0xa869,
};

const chains = [
  { id: 'arbitrum', name: 'Arbitrum', testnet: 'Arbitrum Sepolia' },
  { id: 'ethereum', name: 'Ethereum', testnet: 'Ethereum Sepolia' },
  { id: 'polygon', name: 'Polygon', testnet: 'Polygon Amoy' },
  { id: 'avalanche', name: 'Avalanche', testnet: 'Avalanche Fuji' },
];

const Swap: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [destChain, setDestChain] = useState<'fuji' | 'sepolia' | 'amoy'>('sepolia');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { isConnected, chainId } = useWallet();
  const network = getNetworkByChainId(chainId as any);
  const minter = useContract('Minter');

  const handleSwap = async () => {
    if (!minter || !isConnected || !amount || !network) return;
    setLoading(true);
    setTxHash(null);
    try {
      const tx = await minter.burnAndMint(ethers.parseUnits(amount, 18), DEST_CHAIN_IDS[destChain]);
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err) {
      alert('Swap failed: ' + (err as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Cross-Chain Swap</h1>
        <p className="text-gray-400 mb-8">Swap DSC tokens across different blockchain networks</p>
        <div className="glass-morphism rounded-xl p-12">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount to swap"
            className="w-full p-4 mb-4 bg-white/5 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-500"
          />
          <select
            value={destChain}
            onChange={e => setDestChain(e.target.value as 'fuji' | 'sepolia' | 'amoy')}
            className="w-full p-4 mb-4 bg-white/5 border border-gray-700 rounded-lg text-white"
          >
            <option value="sepolia">Sepolia</option>
            <option value="amoy">Amoy</option>
            <option value="fuji">Fuji</option>
          </select>
          <GradientButton
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || loading || !isConnected}
            onClick={handleSwap}
          >
            {loading ? 'Swapping...' : `Swap DSC`}
          </GradientButton>
          {txHash && (
            <div className="mt-4 text-green-400 text-center">
              Swap successful! Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Swap;