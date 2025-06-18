// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

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
        return 0.01 ether; // Mock fee
    }

    function isChainSupported(uint64 /* chainSelector */) external pure override returns (bool) {
        return true; // Mock support for all chains
    }

    function getSupportedTokens(uint64 /* chainSelector */) external pure returns (address[] memory) {
        return new address[](0); // No token transfers in tests
    }
}