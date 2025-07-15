
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CrossCreditToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BlockDAGRouter
 * @notice Router contract for BlockDAG testnet cross-chain operations
 * @dev Handles cross-chain token transfers and credit operations
 */
contract BlockDAGRouter is Ownable, ReentrancyGuard {
    CrossCreditToken public immutable crossCreditToken;
    
    // Chain configuration
    uint256 public constant BLOCKDAG_CHAIN_ID = 1043;
    uint256 public constant MIN_TRANSFER_AMOUNT = 1 * 10**18; // 1 XCC minimum
    uint256 public constant MAX_TRANSFER_AMOUNT = 1_000_000 * 10**18; // 1M XCC maximum
    
    // Supported chains for cross-chain operations
    mapping(uint256 => bool) public supportedChains;
    mapping(uint256 => string) public chainNames;
    mapping(uint256 => string) public chainRpcUrls;
    
    // Bridge operators
    mapping(address => bool) public bridgeOperators;
    
    // Transaction tracking
    struct CrossChainTx {
        address sender;
        address receiver;
        uint256 amount;
        uint256 sourceChain;
        uint256 targetChain;
        uint256 timestamp;
        bool processed;
        bytes32 txHash;
    }
    
    mapping(bytes32 => CrossChainTx) public crossChainTransactions;
    mapping(address => bytes32[]) public userTransactions;
    
    // Events
    event ChainAdded(uint256 indexed chainId, string name, string rpcUrl);
    event ChainRemoved(uint256 indexed chainId);
    event BridgeOperatorAdded(address indexed operator);
    event BridgeOperatorRemoved(address indexed operator);
    event CrossChainTransferInitiated(
        bytes32 indexed txHash,
        address indexed sender,
        address indexed receiver,
        uint256 amount,
        uint256 targetChain
    );
    event CrossChainTransferCompleted(
        bytes32 indexed txHash,
        address indexed receiver,
        uint256 amount
    );
    
    // Custom errors
    error UnsupportedChain();
    error InvalidTransferAmount();
    error NotBridgeOperator();
    error TransactionNotFound();
    error TransactionAlreadyProcessed();
    error InvalidChainId();

    modifier onlyBridgeOperator() {
        if (!bridgeOperators[msg.sender]) revert NotBridgeOperator();
        _;
    }

    constructor(address payable _crossCreditToken) {
        crossCreditToken = CrossCreditToken(_crossCreditToken);
        
        // Add initial supported chains
        _addChain(1, "Ethereum Mainnet", "https://mainnet.infura.io/v3/");
        _addChain(11155111, "Ethereum Sepolia", "https://sepolia.infura.io/v3/");
        _addChain(137, "Polygon Mainnet", "https://polygon-rpc.com");
        _addChain(80001, "Polygon Mumbai", "https://rpc-mumbai.maticvigil.com");
        _addChain(42161, "Arbitrum One", "https://arb1.arbitrum.io/rpc");
        _addChain(421613, "Arbitrum Goerli", "https://goerli-rollup.arbitrum.io/rpc");
        _addChain(10, "Optimism", "https://mainnet.optimism.io");
        _addChain(420, "Optimism Goerli", "https://goerli.optimism.io");
        _addChain(43114, "Avalanche C-Chain", "https://api.avax.network/ext/bc/C/rpc");
        _addChain(43113, "Avalanche Fuji", "https://api.avax-test.network/ext/bc/C/rpc");
        
        // Add deployer as initial bridge operator
        bridgeOperators[msg.sender] = true;
    }

    /**
     * @notice Initiate cross-chain transfer
     * @param receiver Receiver address on target chain
     * @param amount Amount to transfer
     * @param targetChain Target chain ID
     */
    function initiateCrossChainTransfer(
        address receiver,
        uint256 amount,
        uint256 targetChain
    ) external nonReentrant returns (bytes32 txHash) {
        if (!supportedChains[targetChain]) revert UnsupportedChain();
        if (amount < MIN_TRANSFER_AMOUNT || amount > MAX_TRANSFER_AMOUNT) {
            revert InvalidTransferAmount();
        }
        
        // Transfer tokens to router
        crossCreditToken.transferFrom(msg.sender, address(this), amount);
        
        // Generate transaction hash
        txHash = keccak256(abi.encodePacked(
            msg.sender,
            receiver,
            amount,
            BLOCKDAG_CHAIN_ID,
            targetChain,
            block.timestamp,
            block.number
        ));
        
        // Store transaction
        crossChainTransactions[txHash] = CrossChainTx({
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            sourceChain: BLOCKDAG_CHAIN_ID,
            targetChain: targetChain,
            timestamp: block.timestamp,
            processed: false,
            txHash: txHash
        });
        
        // Track user transactions
        userTransactions[msg.sender].push(txHash);
        
        // Initiate cross-chain send
        crossCreditToken.crossChainSend(receiver, amount, targetChain);
        
        emit CrossChainTransferInitiated(txHash, msg.sender, receiver, amount, targetChain);
        
        return txHash;
    }

    /**
     * @notice Complete cross-chain transfer (bridge operators only)
     * @param txHash Transaction hash
     * @param receiver Receiver address
     * @param amount Amount to transfer
     * @param sourceChain Source chain ID
     */
    function completeCrossChainTransfer(
        bytes32 txHash,
        address receiver,
        uint256 amount,
        uint256 sourceChain
    ) external onlyBridgeOperator nonReentrant {
        CrossChainTx storage transaction = crossChainTransactions[txHash];
        
        if (transaction.sender == address(0)) revert TransactionNotFound();
        if (transaction.processed) revert TransactionAlreadyProcessed();
        
        // Mark as processed
        transaction.processed = true;
        
        // Complete cross-chain receive
        crossCreditToken.crossChainReceive(receiver, amount, sourceChain, txHash);
        
        emit CrossChainTransferCompleted(txHash, receiver, amount);
    }

    /**
     * @notice Add supported chain
     * @param chainId Chain ID
     * @param name Chain name
     * @param rpcUrl Chain RPC URL
     */
    function addChain(
        uint256 chainId,
        string calldata name,
        string calldata rpcUrl
    ) external onlyOwner {
        _addChain(chainId, name, rpcUrl);
    }

    function _addChain(uint256 chainId, string memory name, string memory rpcUrl) internal {
        if (chainId == 0) revert InvalidChainId();
        
        supportedChains[chainId] = true;
        chainNames[chainId] = name;
        chainRpcUrls[chainId] = rpcUrl;
        
        emit ChainAdded(chainId, name, rpcUrl);
    }

    /**
     * @notice Remove supported chain
     * @param chainId Chain ID to remove
     */
    function removeChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = false;
        delete chainNames[chainId];
        delete chainRpcUrls[chainId];
        
        emit ChainRemoved(chainId);
    }

    /**
     * @notice Add bridge operator
     * @param operator Operator address
     */
    function addBridgeOperator(address operator) external onlyOwner {
        bridgeOperators[operator] = true;
        emit BridgeOperatorAdded(operator);
    }

    /**
     * @notice Remove bridge operator
     * @param operator Operator address
     */
    function removeBridgeOperator(address operator) external onlyOwner {
        bridgeOperators[operator] = false;
        emit BridgeOperatorRemoved(operator);
    }

    /**
     * @notice Get user's transaction history
     * @param user User address
     * @return txHashes Array of transaction hashes
     */
    function getUserTransactions(address user) external view returns (bytes32[] memory txHashes) {
        return userTransactions[user];
    }

    /**
     * @notice Get transaction details
     * @param txHash Transaction hash
     * @return transaction Transaction details
     */
    function getTransaction(bytes32 txHash) external view returns (CrossChainTx memory transaction) {
        return crossChainTransactions[txHash];
    }

    /**
     * @notice Get supported chains
     * @param chainId Chain ID
     * @return supported Whether chain is supported
     * @return name Chain name
     * @return rpcUrl Chain RPC URL
     */
    function getChainInfo(uint256 chainId) external view returns (
        bool supported,
        string memory name,
        string memory rpcUrl
    ) {
        return (supportedChains[chainId], chainNames[chainId], chainRpcUrls[chainId]);
    }

    /**
     * @notice Emergency withdrawal
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address payable token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            CrossCreditToken(token).transfer(owner(), amount);
        }
    }

    receive() external payable {}
}
