// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title MainRouter
 * @notice Main router contract deployed on Avalanche that coordinates cross-chain lending operations
 * @dev This contract handles credit scoring, health factor validation, and CCIP messaging
 */
contract MainRouter is CCIPReceiver, OwnerIsCreator, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // Custom errors
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowed(uint64 destinationChainSelector);
    error SourceChainNotAllowed(uint64 sourceChainSelector);
    error SenderNotAllowed(address sender);
    error InvalidCreditScore(uint256 score);
    error HealthFactorTooLow(uint256 healthFactor);
    error InsufficientCollateral(uint256 required, uint256 available);

    // Events
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string message,
        uint256 fees
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string message
    );

    event DepositReceived(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint64 sourceChain
    );

    event BorrowApproved(
        address indexed user,
        uint256 amount,
        uint64 destinationChain,
        uint256 creditScore
    );

    event CreditScoreUpdated(address indexed user, uint256 newScore);

    // Constants
    uint256 public constant MIN_HEALTH_FACTOR = 1.5e18; // 1.5 with 18 decimals
    uint256 public constant MAX_LTV = 75; // 75% max loan-to-value ratio
    uint256 public constant CREDIT_SCORE_MULTIPLIER = 10; // Credit score affects borrowing power

    // State variables
    IRouterClient private s_router;
    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    
    // User data
    mapping(address => UserProfile) public userProfiles;
    mapping(address => mapping(address => uint256)) public userDeposits; // user => token => amount
    mapping(address => uint256) public userBorrows; // user => borrowed amount
    mapping(address => uint256) public creditScores; // user => credit score (0-1000)
    
    // Price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Chainlink Functions
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public lastRequestId;
    mapping(bytes32 => address) public requestToUser;

    struct UserProfile {
        uint256 totalDeposited;
        uint256 totalBorrowed;
        uint256 creditScore;
        uint256 healthFactor;
        bool hasNFT;
        uint256 lastUpdated;
    }

    struct MessageData {
        address user;
        address token;
        uint256 amount;
        uint8 action; // 0: deposit, 1: borrow, 2: repay, 3: liquidate
    }

    modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector) {
        if (!allowlistedDestinationChains[_destinationChainSelector])
            revert DestinationChainNotAllowed(_destinationChainSelector);
        _;
    }

    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        if (!allowlistedSourceChains[_sourceChainSelector])
            revert SourceChainNotAllowed(_sourceChainSelector);
        if (!allowlistedSenders[_sender])
            revert SenderNotAllowed(_sender);
        _;
    }

    constructor(
        address _router,
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId
    ) CCIPReceiver(_router) FunctionsClient(_functionsRouter) {
        s_router = IRouterClient(_router);
        donId = _donId;
        subscriptionId = _subscriptionId;
    }

    // Allowlist management functions
    function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    // Price feed management
    function setPriceFeed(address _token, address _priceFeed) external onlyOwner {
        priceFeeds[_token] = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @notice Processes deposit information received from other chains
     * @param user The user who made the deposit
     * @param token The token that was deposited
     * @param amount The amount deposited
     * @param sourceChain The chain where the deposit was made
     */
    function processDeposit(
        address user,
        address token,
        uint256 amount,
        uint64 sourceChain
    ) internal {
        userDeposits[user][token] += amount;
        userProfiles[user].totalDeposited += amount;
        userProfiles[user].lastUpdated = block.timestamp;
        
        // Update health factor
        _updateHealthFactor(user);
        
        emit DepositReceived(user, token, amount, sourceChain);
    }

    /**
     * @notice Approves a borrow request if user meets requirements
     * @param user The user requesting to borrow
     * @param amount The amount to borrow
     * @param destinationChain The chain where DSC should be minted
     */
    function approveBorrow(
        address user,
        uint256 amount,
        uint64 destinationChain
    ) external onlyAllowlistedDestinationChain(destinationChain) {
        // Check credit score
        uint256 creditScore = creditScores[user];
        if (creditScore < 500) revert InvalidCreditScore(creditScore);
        
        // Calculate max borrowable amount based on collateral and credit score
        uint256 maxBorrowable = _calculateMaxBorrowable(user);
        if (amount > maxBorrowable) {
            revert InsufficientCollateral(amount, maxBorrowable);
        }
        
        // Update user borrow amount
        userBorrows[user] += amount;
        userProfiles[user].totalBorrowed += amount;
        userProfiles[user].lastUpdated = block.timestamp;
        
        // Calculate health factor after borrow
        uint256 newHealthFactor = _calculateHealthFactor(user);
        if (newHealthFactor < MIN_HEALTH_FACTOR) {
            revert HealthFactorTooLow(newHealthFactor);
        }
        
        userProfiles[user].healthFactor = newHealthFactor;
        
        // Send CCIP message to Minter contract to mint DSC
        _sendBorrowApproval(user, amount, destinationChain);
        
        emit BorrowApproved(user, amount, destinationChain, creditScore);
    }

    /**
     * @notice Requests credit score update using Chainlink Functions
     * @param user The user to update credit score for
     * @param source JavaScript code to fetch credit data
     */
    function requestCreditScoreUpdate(
        address user,
        string calldata source
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        string[] memory args = new string[](1);
        args[0] = _toHexString(user);
        req.setArgs(args);
        
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        requestToUser[requestId] = user;
        lastRequestId = requestId;
        
        return requestId;
    }

    /**
     * @notice Callback function for Chainlink Functions
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            // Handle error
            return;
        }
        
        address user = requestToUser[requestId];
        uint256 newScore = abi.decode(response, (uint256));
        
        // Validate score range (0-1000)
        if (newScore > 1000) newScore = 1000;
        
        creditScores[user] = newScore;
        userProfiles[user].creditScore = newScore;
        userProfiles[user].lastUpdated = block.timestamp;
        
        emit CreditScoreUpdated(user, newScore);
    }

    // Internal helper functions
    function _sendBorrowApproval(
        address user,
        uint256 amount,
        uint64 destinationChain
    ) internal {
        MessageData memory data = MessageData({
            user: user,
            token: address(0), // DSC token address will be known by Minter
            amount: amount,
            action: 1 // borrow action
        });
        
        string memory message = _encodeMessageData(data);
        _sendMessage(destinationChain, message);
    }

    function _sendMessage(
        uint64 destinationChainSelector,
        string memory message
    ) internal returns (bytes32 messageId) {
        address receiver = allowlistedSenders[_getReceiverAddress(destinationChainSelector)];
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(message),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0) // Pay in native token
        });

        uint256 fees = s_router.getFee(destinationChainSelector, evm2AnyMessage);

        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);

        messageId = s_router.ccipSend{value: fees}(
            destinationChainSelector,
            evm2AnyMessage
        );

        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            message,
            fees
        );

        return messageId;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        bytes32 messageId = any2EvmMessage.messageId;
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector;
        address sender = abi.decode(any2EvmMessage.sender, (address));
        string memory message = abi.decode(any2EvmMessage.data, (string));

        MessageData memory data = _decodeMessageData(message);
        
        if (data.action == 0) {
            // Process deposit
            processDeposit(data.user, data.token, data.amount, sourceChainSelector);
        }

        emit MessageReceived(messageId, sourceChainSelector, sender, message);
    }

    function _calculateMaxBorrowable(address user) internal view returns (uint256) {
        uint256 totalCollateralValue = _getTotalCollateralValue(user);
        uint256 creditScore = creditScores[user];
        
        // Base LTV adjusted by credit score
        uint256 adjustedLTV = MAX_LTV + (creditScore * CREDIT_SCORE_MULTIPLIER / 100);
        if (adjustedLTV > 90) adjustedLTV = 90; // Max 90% LTV even with perfect credit
        
        return (totalCollateralValue * adjustedLTV) / 100;
    }

    function _calculateHealthFactor(address user) internal view returns (uint256) {
        uint256 totalCollateralValue = _getTotalCollateralValue(user);
        uint256 totalBorrowed = userBorrows[user];
        
        if (totalBorrowed == 0) return type(uint256).max;
        
        // Health Factor = (Collateral Value * Liquidation Threshold) / Total Borrowed
        uint256 liquidationThreshold = 80; // 80%
        return (totalCollateralValue * liquidationThreshold * 1e18) / (totalBorrowed * 100);
    }

    function _updateHealthFactor(address user) internal {
        userProfiles[user].healthFactor = _calculateHealthFactor(user);
    }

    function _getTotalCollateralValue(address user) internal view returns (uint256) {
        // This would iterate through all deposited tokens and calculate USD value
        // For simplicity, returning a placeholder value
        return userProfiles[user].totalDeposited;
    }

    function _getTokenPrice(address token) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[token];
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }

    function _encodeMessageData(MessageData memory data) internal pure returns (string memory) {
        // Simple encoding - in production, use more robust serialization
        return string(abi.encodePacked(
            _addressToString(data.user), ",",
            _addressToString(data.token), ",",
            _uint256ToString(data.amount), ",",
            _uint8ToString(data.action)
        ));
    }

    function _decodeMessageData(string memory message) internal pure returns (MessageData memory) {
        // Simple decoding - in production, use more robust deserialization
        // This is a placeholder implementation
        return MessageData({
            user: address(0),
            token: address(0),
            amount: 0,
            action: 0
        });
    }

    function _getReceiverAddress(uint64 chainSelector) internal pure returns (address) {
        // Return the appropriate receiver address for each chain
        // This would be configured based on deployed contract addresses
        return address(0);
    }

    // Utility functions
    function _addressToString(address _addr) internal pure returns (string memory) {
        return _toHexString(_addr);
    }

    function _uint256ToString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }

    function _uint8ToString(uint8 _i) internal pure returns (string memory) {
        return _uint256ToString(uint256(_i));
    }

    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            buffer[2 + i * 2] = _toHexChar(uint8(bytes20(addr)[i]) / 16);
            buffer[3 + i * 2] = _toHexChar(uint8(bytes20(addr)[i]) % 16);
        }
        return string(buffer);
    }

    function _toHexChar(uint8 value) internal pure returns (bytes1) {
        if (value < 10) {
            return bytes1(uint8(48 + value));
        } else {
            return bytes1(uint8(87 + value));
        }
    }

    // View functions
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    function getUserCreditScore(address user) external view returns (uint256) {
        return creditScores[user];
    }

    function getHealthFactor(address user) external view returns (uint256) {
        return _calculateHealthFactor(user);
    }

    // Receive function to accept native tokens
    receive() external payable {}

    // Withdraw functions
    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        
        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }

    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) revert NothingToWithdraw();
        
        IERC20(_token).transfer(_beneficiary, amount);
    }
}