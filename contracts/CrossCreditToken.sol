
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossCreditToken
 * @notice The main token for cross-chain credit operations on BlockDAG
 * @dev ERC20 token with burning capabilities and controlled minting
 */
contract CrossCreditToken is ERC20, ERC20Burnable, Ownable {
    // Token configuration
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion max supply
    
    // Fee structure for cross-chain operations
    uint256 public sendFee = 100; // 1% = 100 basis points
    uint256 public receiveFee = 50; // 0.5% = 50 basis points
    uint256 public constant MAX_FEE = 1000; // 10% maximum fee
    
    // Cross-chain operations tracking
    mapping(address => uint256) public pendingSends;
    mapping(address => uint256) public pendingReceives;
    mapping(bytes32 => bool) public processedTransactions;
    
    // Events
    event CrossChainSend(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 targetChain,
        bytes32 indexed txHash
    );
    
    event CrossChainReceive(
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 sourceChain,
        bytes32 indexed txHash
    );
    
    event FeeUpdated(uint256 sendFee, uint256 receiveFee);
    
    // Custom errors
    error ExceedsMaxSupply();
    error InvalidFee();
    error TransactionAlreadyProcessed();
    error InsufficientBalance();
    error InvalidAmount();

    constructor() ERC20("CrossCredit Token", "XCC") Ownable() {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @notice Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }

    /**
     * @notice Initiate cross-chain send
     * @param to Destination address
     * @param amount Amount to send
     * @param targetChain Target chain ID
     */
    function crossChainSend(
        address to,
        uint256 amount,
        uint256 targetChain
    ) external returns (bytes32 txHash) {
        if (amount == 0) revert InvalidAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        uint256 fee = (amount * sendFee) / 10000;
        uint256 netAmount = amount - fee;
        
        // Burn the tokens being sent
        _burn(msg.sender, amount);
        
        // Track pending transaction
        pendingSends[msg.sender] += netAmount;
        
        // Generate transaction hash
        txHash = keccak256(abi.encodePacked(
            msg.sender,
            to,
            netAmount,
            targetChain,
            block.timestamp,
            block.number
        ));
        
        emit CrossChainSend(msg.sender, to, netAmount, fee, targetChain, txHash);
        
        return txHash;
    }

    /**
     * @notice Process cross-chain receive
     * @param to Destination address
     * @param amount Amount to receive
     * @param sourceChain Source chain ID
     * @param txHash Original transaction hash
     */
    function crossChainReceive(
        address to,
        uint256 amount,
        uint256 sourceChain,
        bytes32 txHash
    ) external onlyOwner {
        if (processedTransactions[txHash]) revert TransactionAlreadyProcessed();
        if (amount == 0) revert InvalidAmount();
        
        uint256 fee = (amount * receiveFee) / 10000;
        uint256 netAmount = amount - fee;
        
        // Mark transaction as processed
        processedTransactions[txHash] = true;
        
        // Track pending receive
        pendingReceives[to] += netAmount;
        
        // Mint tokens to destination
        _mint(to, netAmount);
        
        emit CrossChainReceive(to, netAmount, fee, sourceChain, txHash);
    }

    /**
     * @notice Update cross-chain fees
     * @param _sendFee New send fee in basis points
     * @param _receiveFee New receive fee in basis points
     */
    function updateFees(uint256 _sendFee, uint256 _receiveFee) external onlyOwner {
        if (_sendFee > MAX_FEE || _receiveFee > MAX_FEE) revert InvalidFee();
        
        sendFee = _sendFee;
        receiveFee = _receiveFee;
        
        emit FeeUpdated(_sendFee, _receiveFee);
    }

    /**
     * @notice Get send fee for amount
     * @param amount Amount to calculate fee for
     * @return fee Fee amount
     */
    function getSendFee(uint256 amount) external view returns (uint256 fee) {
        return (amount * sendFee) / 10000;
    }

    /**
     * @notice Get receive fee for amount
     * @param amount Amount to calculate fee for
     * @return fee Fee amount
     */
    function getReceiveFee(uint256 amount) external view returns (uint256 fee) {
        return (amount * receiveFee) / 10000;
    }

    /**
     * @notice Get net amount after send fee
     * @param amount Gross amount
     * @return netAmount Net amount after fee
     */
    function getNetSendAmount(uint256 amount) external view returns (uint256 netAmount) {
        uint256 fee = (amount * sendFee) / 10000;
        return amount - fee;
    }

    /**
     * @notice Get net amount after receive fee
     * @param amount Gross amount
     * @return netAmount Net amount after fee
     */
    function getNetReceiveAmount(uint256 amount) external view returns (uint256 netAmount) {
        uint256 fee = (amount * receiveFee) / 10000;
        return amount - fee;
    }

    /**
     * @notice Check if transaction is processed
     * @param txHash Transaction hash to check
     * @return processed Whether transaction is processed
     */
    function isTransactionProcessed(bytes32 txHash) external view returns (bool processed) {
        return processedTransactions[txHash];
    }

    /**
     * @notice Get user's pending send amount
     * @param user User address
     * @return amount Pending send amount
     */
    function getPendingSends(address user) external view returns (uint256 amount) {
        return pendingSends[user];
    }

    /**
     * @notice Get user's pending receive amount
     * @param user User address
     * @return amount Pending receive amount
     */
    function getPendingReceives(address user) external view returns (uint256 amount) {
        return pendingReceives[user];
    }

    /**
     * @notice Emergency withdraw (only owner)
     * @param token Token address (address(0) for native)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    // Receive native tokens
    receive() external payable {}
}
