import React, { useState, useEffect } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import GradientButton from '../components/UI/GradientButton';
import { useContract } from '../utils/useContract';
import { ethers } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { getNetworkByChainId } from '../utils/addresses';

const Deposit: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<keyof typeof TOKEN_ADDRESSES>('eth');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const { address, isConnected, chainId } = useWallet();
  const network = getNetworkByChainId(chainId as any);
  const depositor = useContract('Depositor');

  const TOKEN_ADDRESSES = {
    eth: ethers.ZeroAddress, // Native ETH
   weth: '0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534' // WETH on Sepolia
  };

  const tokens = [
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: '$2,350' },
    { id: 'weth', name: 'Wrapped Ether', symbol: 'WETH', price: '$2,350' },
  ];

  const selectedTokenData = tokens.find(t => t.id === selectedToken);
  const SEPOLIA_CHAIN_ID = 11155111;

  const fetchBalance = async () => {
    if (!window.ethereum || !address || !chainId) {
      setWalletBalance('0');
      return;
    }
    if (Number(chainId) !== SEPOLIA_CHAIN_ID) {
      setWalletBalance('0');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    if (selectedToken === 'eth') {
      const balance = await provider.getBalance(address);
      setWalletBalance(Number(ethers.formatEther(balance)).toFixed(4));
    } else if (selectedToken === 'weth') {
      const erc20 = new ethers.Contract(
        TOKEN_ADDRESSES.weth,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      );
      const [bal, decimals] = await Promise.all([erc20.balanceOf(address), erc20.decimals()]);
      setWalletBalance((Number(bal) / 10 ** Number(decimals)).toFixed(4));
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address, selectedToken, chainId, txHash]);

  useEffect(() => {
    if (chainId && Number(chainId) !== SEPOLIA_CHAIN_ID && window.ethereum) {
      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      }).catch(() => {
        alert('Please switch to Sepolia network manually.');
        fetchBalance(); // Refetch balance after potential switch
      });
    }
  }, [chainId]);

  const handleWrapETH = async () => {
    if (!window.ethereum || !address || !amount || parseFloat(amount) <= 0 || network !== 'sepolia') {
      alert('Please connect wallet, ensure Sepolia network, and enter a valid amount.');
      return;
    }
    setLoading(true);
    setTxHash(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const wethContract = new ethers.Contract(
        TOKEN_ADDRESSES.weth,
        ['function deposit() public payable'],
        signer
      );
      const tx = await wethContract.deposit({ value: ethers.parseUnits(amount, 18) });
      await tx.wait();
      setTxHash(tx.hash);
      alert(`Successfully wrapped ${amount} ETH to WETH!`);
      setSelectedToken('weth');
      setAmount('');
    } catch (err) {
      alert('Wrapping failed: ' + (err as any)?.message);
    } finally {
      setLoading(false);
      fetchBalance(); // Update balance after wrapping
    }
  };

 const handleDeposit = async () => {
  if (!depositor || !isConnected || !address || !amount || parseFloat(amount) <= 0 || network !== 'sepolia') return;
  setLoading(true);
  setTxHash(null);
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const depositorAbi = [
      'function depositToken(address,uint256) public',
      'function isTokenSupported(address) public view returns (bool)'
    ];
    const depositorWithSigner = new ethers.Contract(
      depositor.target,
      depositorAbi,
      signer
    );
    const tokenAddress = TOKEN_ADDRESSES[selectedToken];
    const parsedAmount = ethers.parseUnits(amount, 18);

    const isSupported = await depositorWithSigner.isTokenSupported(tokenAddress);
    if (!isSupported) {
      alert('Error: Token is not supported by the Depositor contract.');
      setLoading(false);
      return;
    }

    if (selectedToken === 'weth') {
      const erc20 = new ethers.Contract(
        tokenAddress,
        ['function approve(address,uint256) public returns (bool)', 'function allowance(address,address) view returns (uint256)'],
        signer
      );
      const allowance = await erc20.allowance(address, depositor.target);
      if (allowance < parsedAmount) {
        const approveTx = await erc20.approve(depositor.target, parsedAmount);
        await approveTx.wait();
      }
      const tx = await depositorWithSigner.depositToken(tokenAddress, parsedAmount, {
        gasLimit: 300_000,
      });
      await tx.wait();
      setTxHash(tx.hash);
    } else {
      const tx = await depositorWithSigner.depositToken(tokenAddress, parsedAmount, {
        value: parsedAmount,
        gasLimit: 300_000,
      });
      await tx.wait();
      setTxHash(tx.hash);
    }

    alert(`Successfully deposited ${amount} ${selectedTokenData?.symbol}!`);
  } catch (err) {
    const reason = (err as any)?.error?.data?.message || (err as any)?.reason || (err as any)?.message;
    console.error('Deposit error:', reason);
    if (reason?.includes('TokenNotSupported')) alert('Error: Token is not supported.');
    else if (reason?.includes('ZeroAmount')) alert('Error: Amount cannot be zero.');
    else if (reason?.includes('InsufficientTokenBalance')) alert('Error: Insufficient token balance.');
    else alert('Deposit failed: ' + reason);
  } finally {
    setLoading(false);
    fetchBalance(); // Refresh wallet balance
  }
};


  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Deposit Collateral</h1>
          <p className="text-gray-400">Deposit tokens to use as collateral on Sepolia</p>
        </div>
        <div className="glass-morphism rounded-xl p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Token</label>
            <div className="relative">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value as keyof typeof TOKEN_ADDRESSES)}
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
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-300">Amount</label>
              <span className="text-sm text-gray-400">Balance: {walletBalance} {selectedTokenData?.symbol || 'N/A'}</span>
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
                  onClick={() => setAmount(walletBalance)}
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
          {selectedToken === 'eth' && (
            <GradientButton
              size="lg"
              className="w-full mb-4"
              disabled={!amount || parseFloat(amount) <= 0 || loading || !isConnected || network !== 'sepolia'}
              onClick={handleWrapETH}
            >
              {loading ? 'Wrapping...' : `Wrap ETH to WETH`}
            </GradientButton>
          )}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Deposit Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Network</span><span className="text-white">Ethereum Sepolia</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Token</span><span className="text-white">{selectedTokenData?.symbol}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white">{amount || '0'} {selectedTokenData?.symbol}</span></div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300"><p className="font-medium mb-1">Collateral on Sepolia</p><p>Your deposited tokens will be available as collateral on Sepolia.</p></div>
            </div>
          </div>
          <GradientButton
            size="lg"
            className="w-full"
            disabled={!amount || parseFloat(amount) <= 0 || loading || !isConnected || network !== 'sepolia'}
            onClick={handleDeposit}
          >
            {loading ? 'Depositing...' : `Deposit ${selectedTokenData?.symbol}`}
          </GradientButton>
          {txHash && (
            <div className="mt-4 text-green-400 text-center">
              Transaction successful! Tx: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deposit;