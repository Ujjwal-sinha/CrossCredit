import React, { useState } from 'react';
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
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">DeFi Passport NFT</h1>
        <p className="text-gray-400 mb-8">Your unique DeFi identity and credit profile</p>
        <div className="glass-morphism rounded-xl p-12">
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
        </div>
      </div>
    </div>
  );
};

export default PassportNFT;