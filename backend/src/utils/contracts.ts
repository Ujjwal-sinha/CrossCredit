import { ethers } from 'ethers';

// Contract ABIs
export const DSC_ABI = [
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function burnFrom(address from, uint256 amount) external',
  'function authorizedMinters(address minter) external view returns (bool)',
  'function isMinter(address minter) external view returns (bool)',
  'function remainingMintableSupply() external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event TokensMinted(address indexed to, uint256 amount, address indexed minter)',
  'event TokensBurned(address indexed from, uint256 amount, address indexed burner)',
] as const;

export const DEPOSITOR_ABI = [
  'function depositToken(address token, uint256 amount) external',
  'function withdrawToken(address token, uint256 amount) external',
  'function userDeposits(address user, address token) external view returns (uint256)',
  'function totalUserDeposits(address user) external view returns (uint256)',
  'function supportedTokens(address token) external view returns (bool)',
  'function tokenList(uint256 index) external view returns (address)',
  'event TokenDeposited(address indexed user, address indexed token, uint256 amount, bytes32 messageId)',
  'event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address receiver, uint256 fees)',
] as const;

export const MAIN_ROUTER_ABI = [
  'function processDeposit(address user, address token, uint256 amount, uint64 sourceChain) external',
  'function setCreditScore(address user, uint256 score) external',
  'function getUserCreditScore(address user) external view returns (uint256)',
  'function userDeposits(address user, address token) external view returns (uint256)',
  'function userBorrows(address user) external view returns (uint256)',
  'function userProfiles(address user) external view returns (uint256 totalDeposited, uint256 totalBorrowed, uint256 creditScore, uint256 healthFactor, bool hasNFT, uint256 lastUpdated)',
  'function priceFeeds(address token) external view returns (address)',
  'function MIN_HEALTH_FACTOR() external view returns (uint256)',
  'function MAX_LTV() external view returns (uint256)',
  'function CREDIT_SCORE_MULTIPLIER() external view returns (uint256)',
  'event DepositReceived(address indexed user, address indexed token, uint256 amount, uint64 sourceChain)',
  'event BorrowApproved(address indexed user, uint256 amount, uint64 destinationChain, uint256 creditScore)',
  'event CreditScoreUpdated(address indexed user, uint256 newScore)',
] as const;

export const MINTER_ABI = [
  'function mintDSC(address user, uint256 amount) external',
  'function burnDSC(uint256 amount) external',
  'function burnAndMint(uint256 amount, uint64 destinationChain) external',
  'function userBorrowedAmounts(address user) external view returns (uint256)',
  'function userTotalBorrowed(address user) external view returns (uint256)',
  'function dscToken() external view returns (address)',
  'function chainToMinter(uint64 chainSelector) external view returns (address)',
  'function pendingSwaps(bytes32 swapId) external view returns (address user, uint256 amount, uint64 sourceChain, uint64 destinationChain, uint256 timestamp, bool completed)',
  'event DSCMinted(address indexed user, uint256 amount, bytes32 indexed messageId)',
  'event DSCBurned(address indexed user, uint256 amount, bytes32 indexed messageId)',
  'event CrossChainSwapInitiated(address indexed user, uint256 amount, uint64 indexed sourceChain, uint64 indexed destinationChain, bytes32 messageId)',
  'event CrossChainSwapCompleted(address indexed user, uint256 amount, uint64 indexed sourceChain, bytes32 messageId)',
] as const;

// Contract factory functions
export const createContract = (
  address: string,
  abi: readonly any[],
  provider: ethers.Provider
) => {
  return new ethers.Contract(address, abi, provider);
};

export const createSignerContract = (
  address: string,
  abi: readonly any[],
  signer: ethers.Signer
) => {
  return new ethers.Contract(address, abi, signer);
}; 