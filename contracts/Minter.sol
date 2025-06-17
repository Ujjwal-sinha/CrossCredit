// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import "./DSC.sol";

/**
 * @title Minter
 * @notice Minter contract deployed on destination chains (Polygon, Optimism, etc.)
 * @dev Handles DSC token minting, burning, and cross-chain swaps via CCIP
 */
contract Minter is CCIPReceiver, OwnerIsCreator {
    // Custom errors
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowed(uint64 destinationChainSelector);
    error SourceChainNotAllowed(uint64 sourceChainSelector);
    error SenderNotAllowed(address sender);
    error InsufficientDSCBalance(uint256 required, uint256 available);
    error UnauthorizedMint(address caller);
    error UnauthorizedBurn(address caller);
    error InvalidBurnAndMintRequest();
    error ZeroAmount();
    error ZeroAddress();

    // Events
    event DSCMinted(
        address indexed user,
        uint256 amount,
        bytes32 indexed messageId
    );

    event DSCBurned(
        address indexed user,
        uint256 amount,
        bytes32 indexed messageId
    );

    event CrossChainSwapInitiated(
        address indexed user,
        uint256 amount,
        uint64 indexed sourceChain,
        uint64 indexed destinationChain,
        bytes32 messageId
    );

    event CrossChainSwapCompleted(
        address indexed user,
        uint256 amount,
        uint64 indexed sourceChain,
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

    // Constants
    uint64 public immutable MAIN_ROUTER_CHAIN_SELECTOR;
    address public immutable MAIN_ROUTER_ADDRESS;

    // State variables
    IRouterClient private s_router;
    DSC public immutable dscToken;
    
    mapping(uint64 => bool) public allowlistedDestinationChains;
    mapping(uint64 => bool) public allowlistedSourceChains;
    mapping(address => bool) public allowlistedSenders;
    mapping(uint64 => address) public chainToMinter; // chainSelector => Minter address on that chain
    
    // User balances and borrow tracking
    mapping(address => uint256) public userBorrowedAmounts; // user => amount borrowed on this chain
    mapping(address => uint256) public userTotalBorrowed; // user => total borrowed across all chains
    
    // Cross-chain swap tracking
    mapping(bytes32 => SwapRequest) public pendingSwaps;
    
    struct SwapRequest {
        address user;
        uint256 amount;
        uint64 sourceChain;
        uint64 destinationChain;
        uint256 timestamp;
        bool completed;
    }

    struct MintMessage {
        address user;
        uint256 amount;
        uint8 action; // 1: mint, 2: burn, 3: burnAndMint
        uint64 destinationChain; // for burnAndMint operations
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

    modifier onlyMainRouter() {
        if (msg.sender != MAIN_ROUTER_ADDRESS && !allowlistedSenders[msg.sender])
            revert UnauthorizedMint(msg.sender);
        _;
    }

    constructor(
        address _router,
        uint64 _mainRouterChainSelector,
        address _mainRouterAddress,
        string memory _dscName,
        string memory _dscSymbol
    ) CCIPReceiver(_router) {
        if (_router == address(0) || _mainRouterAddress == address(0)) 
            revert ZeroAddress();
            
        s_router = IRouterClient(_router);
        MAIN_ROUTER_CHAIN_SELECTOR = _mainRouterChainSelector;
        MAIN_ROUTER_ADDRESS = _mainRouterAddress;
        
        // Deploy DSC token
        dscToken = new DSC(_dscName, _dscSymbol, address(this));
        
        // Allow main router and this contract
        allowlistedSourceChains[_mainRouterChainSelector] = true;
        allowlistedSenders[_mainRouterAddress] = true;
        allowlistedSenders[address(this)] = true;
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

    function setChainMinter(uint64 _chainSelector, address _minterAddress) external onlyOwner {
        chainToMinter[_chainSelector] = _minterAddress;
        allowlistedDestinationChains[_chainSelector] = true;
    }

    /**
     * @notice Mint DSC tokens for a user (called by MainRouter via CCIP)
     * @param user The user to mint tokens for
     * @param amount The amount to mint
     */
    function mintDSC(address user, uint256 amount) external onlyMainRouter {
        if (amount == 0) revert ZeroAmount();
        if (user == address(0)) revert ZeroAddress();
        
        // Mint DSC tokens to user
        dscToken.mint(user, amount);
        
        // Update user borrow tracking
        userBorrowedAmounts[user] += amount;
        userTotalBorrowed[user] += amount;
        
        emit DSCMinted(user, amount, bytes32(0));
    }

    /**
     * @notice Burn DSC tokens from a user
     * @param amount The amount to burn
     */
    function burnDSC(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        
        uint256 userBalance = dscToken.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert InsufficientDSCBalance(amount, userBalance);
        }
        
        // Burn DSC tokens from user
        dscToken.burnFrom(msg.sender, amount);
        
        // Update user borrow tracking
        if (userBorrowedAmounts[msg.sender] >= amount) {
            userBorrowedAmounts[msg.sender] -= amount;
            userTotalBorrowed[msg.sender] -= amount;
        }
        
        emit DSCBurned(msg.sender, amount, bytes32(0));
    }

    /**
     * @notice Cross-chain swap: burn DSC on this chain and mint on another chain
     * @param amount The amount to swap
     * @param destinationChain The chain to mint DSC on
     */
    function burnAndMint(
        uint256 amount,
        uint64 destinationChain
    ) external onlyAllowlistedDestinationChain(destinationChain) {
        if (amount == 0) revert ZeroAmount();
        
        uint256 userBalance = dscToken.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert InsufficientDSCBalance(amount, userBalance);
        }
        
        address destinationMinter = chainToMinter[destinationChain];
        if (destinationMinter == address(0)) {
            revert DestinationChainNotAllowed(destinationChain);
        }
        
        // Burn DSC tokens on this chain
        dscToken.burnFrom(msg.sender, amount);
        
        // Update local tracking (don't reduce total borrowed as it's moving chains)
        if (userBorrowedAmounts[msg.sender] >= amount) {
            userBorrowedAmounts[msg.sender] -= amount;
        }
        
        // Send CCIP message to destination chain Minter
        bytes32 messageId = _sendBurnAndMintMessage(
            msg.sender,
            amount,
            destinationChain,
            destinationMinter
        );
        
        // Track pending swap
        pendingSwaps[messageId] = SwapRequest({
            user: msg.sender,
            amount: amount,
            sourceChain: uint64(block.chainid),
            destinationChain: destinationChain,
            timestamp: block.timestamp,
            completed: false
        });
        
        emit CrossChainSwapInitiated(
            msg.sender,
            amount,
            uint64(block.chainid),
            destinationChain,
            messageId
        );
    }

    /**
     * @notice Process incoming CCIP messages
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

        MintMessage memory mintMsg = _decodeMintMessage(message);
        
        if (mintMsg.action == 1) {
            // Mint DSC for user (from MainRouter borrow approval)
            _mintDSCFromMessage(mintMsg.user, mintMsg.amount, messageId);
        } else if (mintMsg.action == 3) {
            // BurnAndMint completion (from another Minter)
            _completeBurnAndMint(mintMsg.user, mintMsg.amount, sourceChainSelector, messageId);
        }

        emit MessageReceived(messageId, sourceChainSelector, sender, message);
    }

    function _mintDSCFromMessage(address user, uint256 amount, bytes32 messageId) internal {
        // Mint DSC tokens to user
        dscToken.mint(user, amount);
        
        // Update user borrow tracking
        userBorrowedAmounts[user] += amount;
        userTotalBorrowed[user] += amount;
        
        emit DSCMinted(user, amount, messageId);
    }

    function _completeBurnAndMint(
        address user,
        uint256 amount,
        uint64 sourceChain,
        bytes32 messageId
    ) internal {
        // Mint DSC tokens to user (completing cross-chain swap)
        dscToken.mint(user, amount);
        
        // Update user borrow tracking
        userBorrowedAmounts[user] += amount;
        
        emit CrossChainSwapCompleted(user, amount, sourceChain, messageId);
    }

    function _sendBurnAndMintMessage(
        address user,
        uint256 amount,
        uint64 destinationChain,
        address destinationMinter
    ) internal returns (bytes32 messageId) {
        MintMessage memory mintMsg = MintMessage({
            user: user,
            amount: amount,
            action: 3, // burnAndMint action
            destinationChain: destinationChain
        });
        
        string memory encodedMessage = _encodeMintMessage(mintMsg);
        
        return _sendMessage(destinationChain, destinationMinter, encodedMessage);
    }

    function _sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string memory message
    ) internal returns (bytes32 messageId) {
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

    function _encodeMintMessage(MintMessage memory mintMsg) internal pure returns (string memory) {
        // Simple encoding - in production, use more robust serialization
        return string(abi.encodePacked(
            _addressToString(mintMsg.user), ",",
            _uint256ToString(mintMsg.amount), ",",
            _uint256ToString(mintMsg.action), ",",
            _uint256ToString(mintMsg.destinationChain)
        ));
    }

    function _decodeMintMessage(string memory message) internal pure returns (MintMessage memory) {
        // Simple decoding - in production, use more robust deserialization
        // This is a placeholder implementation
        return MintMessage({
            user: address(0),
            amount: 0,
            action: 0,
            destinationChain: 0
        });
    }

    // View functions
    function getUserBorrowedAmount(address user) external view returns (uint256) {
        return userBorrowedAmounts[user];
    }

    function getUserTotalBorrowed(address user) external view returns (uint256) {
        return userTotalBorrowed[user];
    }

    function getDSCBalance(address user) external view returns (uint256) {
        return dscToken.balanceOf(user);
    }

    function getPendingSwap(bytes32 messageId) external view returns (SwapRequest memory) {
        return pendingSwaps[messageId];
    }

    function getBurnAndMintFee(
        uint256 amount,
        uint64 destinationChain
    ) external view returns (uint256 fee) {
        address destinationMinter = chainToMinter[destinationChain];
        if (destinationMinter == address(0)) return 0;
        
        MintMessage memory mintMsg = MintMessage({
            user: msg.sender,
            amount: amount,
            action: 3,
            destinationChain: destinationChain
        });
        
        string memory encodedMessage = _encodeMintMessage(mintMsg);
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationMinter),
            data: abi.encode(encodedMessage),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });

        return s_router.getFee(destinationChain, evm2AnyMessage);
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
        
        IERC20(_token).transfer(_beneficiary, amount);
    }
}