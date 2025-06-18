// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockContracts
 * @notice Consolidated mock contracts for testing MainRouter
 */
contract MockRouter is IRouterClient {
    event MessageSent(
        bytes32 indexed messageId,
        uint64 destinationChainSelector,
        address receiver,
        bytes data,
        Client.EVMTokenAmount[] tokenAmounts,
        address feeToken,
        bytes extraArgs
    );

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external payable override returns (bytes32) {
        bytes32 messageId = keccak256(abi.encodePacked(block.timestamp, msg.sender, destinationChainSelector, message.data));
        address receiver = abi.decode(message.receiver, (address));
        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            message.data,
            message.tokenAmounts,
            message.feeToken,
            message.extraArgs
        );
        return messageId;
    }

    function getFee(
        uint64 /* destinationChainSelector */,
        Client.EVM2AnyMessage memory /* message */
    ) external pure override returns (uint256) {
        return 0.01 ether;
    }

    function isChainSupported(uint64 /* chainSelector */) external pure override returns (bool) {
        return true;
    }

    function getSupportedTokens(uint64 /* chainSelector */) external pure returns (address[] memory) {
        return new address[](0);
    }
}

contract MockFunctionsRouter {
    event RequestSent(bytes32 indexed requestId, bytes data, uint64 subscriptionId, uint32 gasLimit, bytes32 donId);
    
    function sendRequest(
        bytes memory data,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donId
    ) external returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, data));
        emit RequestSent(requestId, data, subscriptionId, gasLimit, donId);
        return requestId;
    }
}




contract MockMainRouter {
    mapping(address => uint256) public creditScores;
    mapping(address => bool) public allowlistedSenders;
    mapping(uint64 => bool) public allowlistedDestinationChains;
    
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event SenderAllowlisted(address indexed sender, bool allowed);
    event ChainAllowlisted(uint64 indexed chainSelector, bool allowed);
    
    function setCreditScore(address user, uint256 score) external {
        creditScores[user] = score > 1000 ? 1000 : score;
        emit CreditScoreUpdated(user, creditScores[user]);
    }
    
    function allowlistSender(address sender, bool allowed) external {
        allowlistedSenders[sender] = allowed;
        emit SenderAllowlisted(sender, allowed);
    }
    
    function allowlistDestinationChain(uint64 chainSelector, bool allowed) external {
        allowlistedDestinationChains[chainSelector] = allowed;
        emit ChainAllowlisted(chainSelector, allowed);
    }
    
    function mockReceiveMessage(
        bytes32 messageId,
        uint64 sourceChainSelector,
        address sender,
        string memory message
    ) external {
        // Implementation for testing message reception
    }
}