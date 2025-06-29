import React, { useState } from 'react';
import { Sparkles, TrendingUp, Info, ShieldCheck } from 'lucide-react';
import { useContract } from '../utils/useContract';
import { useWallet } from '../hooks/useWallet';
import { getNetworkByChainId } from '../utils/addresses';
import GradientButton from '../components/UI/GradientButton';
import { ethers } from 'ethers';

const Borrow: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address, isConnected, chainId } = useWallet();
  const network = getNetworkByChainId(chainId as any);
  const minter = useContract('Minter');

  // New: Example tips and recent activity (mocked)
  const tips = [
    'Tip: Borrow only what you can repay.',
    'Tip: Your collateral ratio affects your borrowing power.',
    'Tip: Borrowing DSC increases your exposure to DeFi.'
  ];
  const recentActivity = [
    { action: 'Borrowed', amount: '100 DSC', time: '5 min ago' },
    { action: 'Borrowed', amount: '50 DSC', time: '1 hr ago' }
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
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Decorative background icon */}
      <Sparkles className="absolute left-0 top-0 w-32 h-32 text-cyber-500 opacity-10 pointer-events-none" />
      <div className="max-w-2xl mx-auto text-center">
        {/* Header with icon */}
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="w-10 h-10 text-cyber-400 mb-2 animate-bounce" />
          <h1 className="text-3xl font-bold text-white mb-4">Borrow DSC</h1>
          <p className="text-gray-400 mb-8">Borrow stablecoins on any supported network using your cross-chain collateral</p>
        </div>
        {/* Step indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyber-400" />
            <span className="text-cyber-300 text-xs">1. Enter Amount</span>
            <div className="w-2 h-0.5 bg-cyber-400 mx-1" />
            <div className="w-3 h-3 rounded-full bg-cyber-400" />
            <span className="text-cyber-300 text-xs">2. Confirm</span>
          </div>
        </div>
        <div className="glass-morphism rounded-xl p-12">
          {/* Info banner */}
          <div className="flex items-center bg-cyber-500/10 border border-cyber-500/20 rounded-lg p-3 mb-6 animate-fade-in">
            <Info className="w-5 h-5 text-cyber-400 mr-2" />
            <span className="text-cyber-200 text-sm">Borrowing is only available if you have sufficient collateral on Sepolia.</span>
          </div>
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

export default Borrow;