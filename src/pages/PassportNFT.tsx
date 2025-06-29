import React, { useState } from 'react';
import { Sparkles, TrendingUp, Info, ShieldCheck } from 'lucide-react';
import { useContract } from '../utils/useContract';
import { useWallet } from '../hooks/useWallet';
import { getNetworkByChainId } from '../utils/addresses';
import GradientButton from '../components/UI/GradientButton';
import { ethers } from 'ethers';

const PassportNFT: React.FC = () => {
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address, isConnected, chainId } = useWallet();
  const network = getNetworkByChainId(chainId as any);
  const passport = useContract('DeFiPassportNFT');

  // Add testnet chain options
  const chains = [
    { id: 'arbitrum', name: 'Arbitrum', testnet: 'Arbitrum Sepolia' },
    { id: 'ethereum', name: 'Ethereum', testnet: 'Ethereum Sepolia' },
    { id: 'polygon', name: 'Polygon', testnet: 'Polygon Amoy' },
    { id: 'avalanche', name: 'Avalanche', testnet: 'Avalanche Fuji' },
  ];

  // New: Example tips and recent activity (mocked)
  const tips = [
    'Tip: Mint your DeFi Passport to unlock protocol features.',
    'Tip: Each wallet can mint only one Passport NFT.',
    'Tip: Your Passport NFT is your on-chain identity.'
  ];
  const recentActivity = [
    { action: 'Minted', amount: '1 Passport NFT', time: 'just now' },
    { action: 'Minted', amount: '1 Passport NFT', time: '2 days ago' }
  ];

  const handleMint = async () => {
    if (!passport || !isConnected || !address || !network || !window.ethereum) return;
    setMinting(true);
    setTxHash(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const passportWithSigner = passport.connect(signer) as typeof passport & { mint: (to: string) => Promise<any> };
      const tx = await passportWithSigner.mint(address);
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err) {
      alert('Mint failed: ' + (err as any)?.message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Decorative background icon */}
      <Sparkles className="absolute left-0 top-0 w-32 h-32 text-cyber-500 opacity-10 pointer-events-none" />
      <div className="max-w-2xl mx-auto text-center">
        {/* Header with icon */}
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="w-10 h-10 text-cyber-400 mb-2 animate-bounce" />
          <h1 className="text-3xl font-bold text-white mb-4">DeFi Passport NFT</h1>
          <p className="text-gray-400 mb-8">Your unique DeFi identity and credit profile</p>
        </div>
        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyber-400" />
            <span className="text-cyber-300 text-xs">1. Connect Wallet</span>
            <div className="w-2 h-0.5 bg-cyber-400 mx-1" />
            <div className="w-3 h-3 rounded-full bg-cyber-400" />
            <span className="text-cyber-300 text-xs">2. Mint Passport</span>
          </div>
        </div>
        <div className="glass-morphism rounded-xl p-12">
          {/* Info banner */}
          <div className="flex items-center bg-cyber-500/10 border border-cyber-500/20 rounded-lg p-3 mb-6 animate-fade-in">
            <Info className="w-5 h-5 text-cyber-400 mr-2" />
            <span className="text-cyber-200 text-sm">Mint your Passport NFT to access all protocol features and build your on-chain reputation.</span>
          </div>
          <GradientButton
            size="lg"
            className="w-full"
            disabled={minting || !isConnected}
            onClick={handleMint}
          >
            {minting ? 'Minting...' : 'Mint Passport NFT'}
          </GradientButton>
          {txHash && (
            <div className="mt-4 text-green-400 text-center">
              Mint successful! Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
            </div>
          )}
          {/* Tips section */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-cyber-300 mb-2 flex items-center"><TrendingUp className="w-4 h-4 mr-1" />Tips</h3>
            <ul className="list-disc list-inside text-cyber-200 text-xs space-y-1">
              {tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
          {/* Recent activity section */}
          <div className="bg-white/5 rounded-lg p-4 mb-2">
            <h3 className="text-sm font-medium text-cyber-300 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-1" />Recent Activity</h3>
            <ul className="text-cyber-200 text-xs space-y-1">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.action} <span className="font-semibold text-cyber-400">{item.amount}</span></span>
                  <span className="text-gray-400">{item.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportNFT;