// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Depositor
 * @notice Depositor contract deployed on source chains (Arbitrum, Ethereum, etc.)
 * @dev Handles token deposits and sends cross-chain messages to MainRouter
 */
contract Depositor is CCIPReceiver, OwnerIsCreator {
    using SafeERC20 for IERC20;

    // Custom errors
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowed(uint64 destinationChainSelector);
    error SourceChainNotAllowed(uint64 sourceChainSelector);
    error SenderNotAllowed(address sender);
    error InsufficientTokenBalance(uint256 required, uint256 available);
    error TokenNotSupported(address token);
    error ZeroAmount();
    error ZeroAddress();

    // Events
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 messageId
    );

    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        uint256 fees
    );

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string message
    );

    event TokenWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    // Constants
    uint64 public immutable MAIN_ROUTER_CHAIN_SELECTOR;
    address public immutable MAIN_ROUTER_ADDRESS;

    // State variables
    IRouterClient private s_router;
    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    mapping(address => bool) public supportedTokens;
    
    // User deposits tracking
    mapping(address => mapping(address => uint256)) public userDeposits; // user => token => amount
    mapping(address => uint256) public totalUserDeposits; // user => total USD value
    
    // Supported tokens list
    address[] public tokenList;

    struct DepositMessage {
        address user;
        address token;
        uint256 amount;
        uint64 sourceChain;
        uint8 action; // 0: deposit, other values for future actions
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

    modifier onlySupportedToken(address _token) {
        if (!supportedTokens[_token])
            revert TokenNotSupported(_token);
        _;
    }

    constructor(
        address _router,
        uint64 _mainRouterChainSelector,
        address _mainRouterAddress
    ) CCIPReceiver(_router) {
        if (_router == address(0) || _mainRouterAddress == address(0)) 
            revert ZeroAddress();
            
        s_router = IRouterClient(_router);
        MAIN_ROUTER_CHAIN_SELECTOR = _mainRouterChainSelector;
        MAIN_ROUTER_ADDRESS = _mainRouterAddress;
        
        // Allow main router by default
        allowlistedDestinationChains[_mainRouterChainSelector] = true;
        allowlistedSenders[_mainRouterAddress] = true;
    }

    // Administration functions
    function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    function addSupportedToken(address _token) external onlyOwner {
        if (_token == address(0)) revert ZeroAddress();
        
        if (!supportedTokens[_token]) {
            supportedTokens[_token] = true;
            tokenList.push(_token);
        }
    }

    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
        
        // Remove from tokenList array
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == _token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
    }

    /**
     * @notice Deposit tokens that will be used as collateral for cross-chain borrowing
     * @param token The token address to deposit
     * @param amount The amount to deposit
     */
    function depositToken(
        address token,
        uint256 amount
    ) external onlySupportedToken(token) {
        if (amount == 0) revert ZeroAmount();
        
        IERC20 tokenContract = IERC20(token);
        uint256 userBalance = tokenContract.balanceOf(msg.sender);
        
        if (userBalance < amount) {
            revert InsufficientTokenBalance(amount, userBalance);
        }
        
        // Transfer tokens from user to this contract
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user deposit tracking
        userDeposits[msg.sender][token] += amount;
        
        // Send cross-chain message to MainRouter
        bytes32 messageId = _sendDepositMessage(msg.sender, token, amount);
        
        emit TokenDeposited(msg.sender, token, amount, messageId);
    }

    /**
     * @notice Withdraw deposited tokens (only if not used as active collateral)
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlySupportedToken(token) {
        if (amount == 0) revert ZeroAmount();
        
        uint256 userDeposit = userDeposits[msg.sender][token];
        if (userDeposit < amount) {
            revert InsufficientTokenBalance(amount, userDeposit);
        }
        
        // Update user deposit tracking
        userDeposits[msg.sender][token] -= amount;
        
        // Transfer tokens back to user
        IERC20(token).safeTransfer(msg.sender, amount);
        
        // TODO: Send message to MainRouter to update collateral accounting
        // This would require approval from MainRouter that collateral is not actively securing loans
        
        emit TokenWithdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Send deposit information to MainRouter via CCIP
     */
    function _sendDepositMessage(
        address user,
        address token,
        uint256 amount
    ) internal returns (bytes32 messageId) {
        DepositMessage memory depositMsg = DepositMessage({
            user: user,
            token: token,
            amount: amount,
            sourceChain: uint64(block.chainid),
            action: 0 // deposit action
        });
        
        string memory encodedMessage = _encodeDepositMessage(depositMsg);
        
        return _sendMessage(
            MAIN_ROUTER_CHAIN_SELECTOR,
            MAIN_ROUTER_ADDRESS,
            encodedMessage
        );
    }

    /**
     * @notice Send a CCIP message to another chain
     */
    function _sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string memory message
    ) internal onlyAllowlistedDestinationChain(destinationChainSelector) returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(message),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0) // Pay fees in native token
        });

        uint256 fees = s_router.getFee(destinationChainSelector, evm2AnyMessage);

        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);

        messageId = s_router.ccipSend{value: fees}(
            destinationChainSelector,
            evm2AnyMessage
        );

        emit MessageSent(messageId, destinationChainSelector, receiver, fees);
        
        return messageId;
    }

    /**
     * @notice Handle incoming CCIP messages
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override onlyAllowlisted(
        any2EvmMessage.sourceChainSelector,
        abi.decode(any2EvmMessage.sender, (address))
    ) {
        bytes32 messageId = any2EvmMessage.messageId;
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector;
        address sender = abi.decode(any2EvmMessage.sender, (address));
        string memory message = abi.decode(any2EvmMessage.data, (string));

        // Process incoming message (e.g., withdrawal approvals from MainRouter)
        _processIncomingMessage(message);

        emit MessageReceived(messageId, sourceChainSelector, sender, message);
    }

    function _processIncomingMessage(string memory message) internal {
        // Parse and process messages from MainRouter
        // This could include withdrawal approvals, liquidation notices, etc.
        // Implementation depends on message format and requirements
    }

    function _encodeDepositMessage(DepositMessage memory depositMsg) internal pure returns (string memory) {
        // Simple encoding - in production, use more robust serialization like JSON or protobuf
        return string(abi.encodePacked(
            _addressToString(depositMsg.user), ",",
            _addressToString(depositMsg.token), ",",
            _uint256ToString(depositMsg.amount), ",",
            _uint256ToString(depositMsg.sourceChain), ",",
            _uint256ToString(depositMsg.action)
        ));
    }

    // View functions
    function getUserDeposit(address user, address token) external view returns (uint256) {
        return userDeposits[user][token];
    }

    function getTotalUserDeposits(address user) external view returns (uint256) {
        return totalUserDeposits[user];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    function getDepositMessageFee(
        address user,
        address token,
        uint256 amount
    ) external view returns (uint256 fee) {
        DepositMessage memory depositMsg = DepositMessage({
            user: user,
            token: token,
            amount: amount,
            sourceChain: uint64(block.chainid),
            action: 0
        });
        
        string memory encodedMessage = _encodeDepositMessage(depositMsg);
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(MAIN_ROUTER_ADDRESS),
            data: abi.encode(encodedMessage),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });

        return s_router.getFee(MAIN_ROUTER_CHAIN_SELECTOR, evm2AnyMessage);
    }

    // Utility functions
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
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

    // Emergency functions
    receive() external payable {}

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
        
        IERC20(_token).safeTransfer(_beneficiary, amount);
    }
}