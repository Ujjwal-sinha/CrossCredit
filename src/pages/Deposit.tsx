import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';

const Deposit: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState('arbitrum');
  const [selectedToken, setSelectedToken] = useState('eth');
  const [amount, setAmount] = useState('');

  const chains = [
    { id: 'arbitrum', name: 'Arbitrum', logo: '🔺' },
    { id: 'ethereum', name: 'Ethereum', logo: '🔹' },
    { id: 'polygon', name: 'Polygon', logo: '🟣' },
  ];

  const tokens = [
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: '2.5', price: '$2,350' },
    { id: 'usdc', name: 'USD Coin', symbol: 'USDC', balance: '1,500', price: '$1.00' },
    { id: 'wbtc', name: 'Wrapped Bitcoin', symbol: 'WBTC', balance: '0.1', price: '$43,200' },
  ];

  const selectedTokenData = tokens.find(t => t.id === selectedToken);

  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Deposit Collateral</h1>
          <p className="text-gray-400">Deposit tokens to use as collateral for cross-chain borrowing</p>
        </div>

        <div className="glass-morphism rounded-xl p-8">
          {/* Chain Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Network
            </label>
            <div className="grid grid-cols-3 gap-3">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`p-4 rounded-lg border text-center transition-all duration-200 ${
                    selectedChain === chain.id
                      ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                      : 'border-gray-700 bg-white/5 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{chain.logo}</div>
                  <div className="text-sm font-medium">{chain.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Token Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Token
            </label>
            <div className="relative">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full p-4 bg-white/5 border border-gray-700 rounded-lg text-white appearance-none cursor-pointer hover:border-gray-600 focus:border-primary-500 focus:outline-none"
              >
                {tokens.map((token) => (
                  <option key={token.id} value={token.id} className="bg-dark-800">
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-300">
                Amount
              </label>
              <span className="text-sm text-gray-400">
                Balance: {selectedTokenData?.balance} {selectedTokenData?.symbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-4 bg-white/5 border border-gray-700 rounded-lg text-white text-lg placeholder-gray-500 hover:border-gray-600 focus:border-primary-500 focus:outline-none"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <button
                  onClick={() => selectedTokenData && setAmount(selectedTokenData.balance)}
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  MAX
                </button>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300 font-medium">{selectedTokenData?.symbol}</span>
              </div>
            </div>
            {amount && (
              <div className="mt-2 text-sm text-gray-400">
                ≈ ${(parseFloat(amount || '0') * parseFloat(selectedTokenData?.price.replace('$', '').replace(',', '') || '0')).toLocaleString()}
              </div>
            )}
          </div>

          {/* Deposit Summary */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Deposit Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">{chains.find(c => c.id === selectedChain)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token</span>
                <span className="text-white">{selectedTokenData?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{amount || '0'} {selectedTokenData?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Gas Fee</span>
                <span className="text-white">~$12</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Cross-Chain Collateral</p>
                <p>Your deposited tokens will be available as collateral for borrowing on other supported networks.</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <GradientButton
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Deposit {selectedTokenData?.symbol}
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default Deposit;