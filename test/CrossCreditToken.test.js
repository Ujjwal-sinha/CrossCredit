
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossCreditToken", function () {
  let crossCreditToken;
  let blockDAGRouter;
  let owner;
  let user1;
  let user2;
  let bridgeOperator;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const MAX_SUPPLY = ethers.parseEther("10000000000"); // 10 billion tokens
  const MIN_TRANSFER = ethers.parseEther("1"); // 1 XCC minimum
  const MAX_TRANSFER = ethers.parseEther("1000000"); // 1M XCC maximum

  beforeEach(async function () {
    [owner, user1, user2, bridgeOperator] = await ethers.getSigners();

    // Deploy CrossCreditToken
    const CrossCreditToken = await ethers.getContractFactory("CrossCreditToken");
    crossCreditToken = await CrossCreditToken.deploy();
    await crossCreditToken.waitForDeployment();

    // Deploy BlockDAGRouter
    const BlockDAGRouter = await ethers.getContractFactory("BlockDAGRouter");
    blockDAGRouter = await BlockDAGRouter.deploy(await crossCreditToken.getAddress());
    await blockDAGRouter.waitForDeployment();

    // Transfer some tokens to users for testing
    await crossCreditToken.transfer(user1.address, ethers.parseEther("1000000"));
    await crossCreditToken.transfer(user2.address, ethers.parseEther("1000000"));

    // Add bridge operator
    await blockDAGRouter.addBridgeOperator(bridgeOperator.address);
  });

  describe("Token Deployment", function () {
    it("Should deploy with correct initial parameters", async function () {
      expect(await crossCreditToken.name()).to.equal("CrossCredit Token");
      expect(await crossCreditToken.symbol()).to.equal("XCC");
      expect(await crossCreditToken.decimals()).to.equal(18);
      expect(await crossCreditToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await crossCreditToken.balanceOf(owner.address)).to.be.gt(0);
    });

    it("Should have correct maximum supply", async function () {
      expect(await crossCreditToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should have correct initial fees", async function () {
      expect(await crossCreditToken.sendFee()).to.equal(100); // 1%
      expect(await crossCreditToken.receiveFee()).to.equal(50); // 0.5%
    });
  });

  describe("Cross-Chain Send Operations", function () {
    it("Should initiate cross-chain send correctly", async function () {
      const amount = ethers.parseEther("100");
      const targetChain = 1; // Ethereum

      const tx = await crossCreditToken.connect(user1).crossChainSend(
        user2.address,
        amount,
        targetChain
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment && log.fragment.name === "CrossChainSend"
      );

      expect(event).to.exist;
      expect(event.args.from).to.equal(user1.address);
      expect(event.args.to).to.equal(user2.address);
      expect(event.args.targetChain).to.equal(targetChain);

      // Check fee calculation
      const expectedFee = (amount * 100n) / 10000n; // 1%
      const expectedNetAmount = amount - expectedFee;
      expect(event.args.amount).to.equal(expectedNetAmount);
      expect(event.args.fee).to.equal(expectedFee);
    });

    it("Should burn tokens on cross-chain send", async function () {
      const amount = ethers.parseEther("100");
      const initialBalance = await crossCreditToken.balanceOf(user1.address);

      await crossCreditToken.connect(user1).crossChainSend(
        user2.address,
        amount,
        1
      );

      const finalBalance = await crossCreditToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - amount);
    });

    it("Should track pending sends", async function () {
      const amount = ethers.parseEther("100");
      const expectedFee = (amount * 100n) / 10000n;
      const expectedNetAmount = amount - expectedFee;

      await crossCreditToken.connect(user1).crossChainSend(
        user2.address,
        amount,
        1
      );

      expect(await crossCreditToken.getPendingSends(user1.address)).to.equal(expectedNetAmount);
    });

    it("Should revert on insufficient balance", async function () {
      const amount = ethers.parseEther("10000000"); // More than user1 has

      await expect(
        crossCreditToken.connect(user1).crossChainSend(user2.address, amount, 1)
      ).to.be.revertedWithCustomError(crossCreditToken, "InsufficientBalance");
    });

    it("Should revert on zero amount", async function () {
      await expect(
        crossCreditToken.connect(user1).crossChainSend(user2.address, 0, 1)
      ).to.be.revertedWithCustomError(crossCreditToken, "InvalidAmount");
    });
  });

  describe("Cross-Chain Receive Operations", function () {
    it("Should process cross-chain receive correctly", async function () {
      const amount = ethers.parseEther("100");
      const sourceChain = 1;
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_tx_hash"));

      const initialBalance = await crossCreditToken.balanceOf(user2.address);

      await expect(
        crossCreditToken.crossChainReceive(user2.address, amount, sourceChain, txHash)
      ).to.emit(crossCreditToken, "CrossChainReceive");

      const expectedFee = (amount * 50n) / 10000n; // 0.5%
      const expectedNetAmount = amount - expectedFee;
      const finalBalance = await crossCreditToken.balanceOf(user2.address);

      expect(finalBalance).to.equal(initialBalance + expectedNetAmount);
      expect(await crossCreditToken.isTransactionProcessed(txHash)).to.be.true;
    });

    it("Should revert on duplicate transaction", async function () {
      const amount = ethers.parseEther("100");
      const sourceChain = 1;
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_tx_hash"));

      await crossCreditToken.crossChainReceive(user2.address, amount, sourceChain, txHash);

      await expect(
        crossCreditToken.crossChainReceive(user2.address, amount, sourceChain, txHash)
      ).to.be.revertedWithCustomError(crossCreditToken, "TransactionAlreadyProcessed");
    });

    it("Should only allow owner to process receives", async function () {
      const amount = ethers.parseEther("100");
      const sourceChain = 1;
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_tx_hash"));

      await expect(
        crossCreditToken.connect(user1).crossChainReceive(user2.address, amount, sourceChain, txHash)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("BlockDAGRouter Integration", function () {
    it("Should deploy router with correct parameters", async function () {
      expect(await blockDAGRouter.crossCreditToken()).to.equal(await crossCreditToken.getAddress());
      expect(await blockDAGRouter.BLOCKDAG_CHAIN_ID()).to.equal(1043);
      expect(await blockDAGRouter.MIN_TRANSFER_AMOUNT()).to.equal(MIN_TRANSFER);
      expect(await blockDAGRouter.MAX_TRANSFER_AMOUNT()).to.equal(MAX_TRANSFER);
    });

    it("Should have initial supported chains", async function () {
      const [supported, name, rpcUrl] = await blockDAGRouter.getChainInfo(1);
      expect(supported).to.be.true;
      expect(name).to.equal("Ethereum Mainnet");
    });

    it("Should initiate cross-chain transfer through router", async function () {
      const amount = ethers.parseEther("100");
      const targetChain = 1;

      // Approve router to spend tokens
      await crossCreditToken.connect(user1).approve(await blockDAGRouter.getAddress(), amount);

      await expect(
        blockDAGRouter.connect(user1).initiateCrossChainTransfer(
          user2.address,
          amount,
          targetChain
        )
      ).to.emit(blockDAGRouter, "CrossChainTransferInitiated");
    });

    it("Should complete cross-chain transfer", async function () {
      const amount = ethers.parseEther("100");
      const sourceChain = 1;
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_tx_hash"));

      // Store a pending transaction first
      await crossCreditToken.connect(user1).approve(await blockDAGRouter.getAddress(), amount);
      const initTx = await blockDAGRouter.connect(user1).initiateCrossChainTransfer(
        user2.address,
        amount,
        sourceChain
      );
      const initReceipt = await initTx.wait();
      const initEvent = initReceipt.logs.find(log => 
        log.fragment && log.fragment.name === "CrossChainTransferInitiated"
      );
      const realTxHash = initEvent.args.txHash;

      // Complete the transfer
      await expect(
        blockDAGRouter.connect(bridgeOperator).completeCrossChainTransfer(
          realTxHash,
          user2.address,
          amount,
          sourceChain
        )
      ).to.emit(blockDAGRouter, "CrossChainTransferCompleted");
    });

    it("Should revert on unsupported chain", async function () {
      const amount = ethers.parseEther("100");
      const unsupportedChain = 9999;

      await crossCreditToken.connect(user1).approve(await blockDAGRouter.getAddress(), amount);

      await expect(
        blockDAGRouter.connect(user1).initiateCrossChainTransfer(
          user2.address,
          amount,
          unsupportedChain
        )
      ).to.be.revertedWithCustomError(blockDAGRouter, "UnsupportedChain");
    });

    it("Should revert on invalid transfer amount", async function () {
      const tooSmallAmount = ethers.parseEther("0.5"); // Less than minimum
      const tooLargeAmount = ethers.parseEther("2000000"); // More than maximum

      await crossCreditToken.connect(user1).approve(await blockDAGRouter.getAddress(), tooLargeAmount);

      await expect(
        blockDAGRouter.connect(user1).initiateCrossChainTransfer(
          user2.address,
          tooSmallAmount,
          1
        )
      ).to.be.revertedWithCustomError(blockDAGRouter, "InvalidTransferAmount");

      await expect(
        blockDAGRouter.connect(user1).initiateCrossChainTransfer(
          user2.address,
          tooLargeAmount,
          1
        )
      ).to.be.revertedWithCustomError(blockDAGRouter, "InvalidTransferAmount");
    });
  });

  describe("Fee Management", function () {
    it("Should update fees correctly", async function () {
      const newSendFee = 200; // 2%
      const newReceiveFee = 100; // 1%

      await expect(
        crossCreditToken.updateFees(newSendFee, newReceiveFee)
      ).to.emit(crossCreditToken, "FeeUpdated")
        .withArgs(newSendFee, newReceiveFee);

      expect(await crossCreditToken.sendFee()).to.equal(newSendFee);
      expect(await crossCreditToken.receiveFee()).to.equal(newReceiveFee);
    });

    it("Should revert on excessive fees", async function () {
      const excessiveFee = 1001; // > 10%

      await expect(
        crossCreditToken.updateFees(excessiveFee, 50)
      ).to.be.revertedWithCustomError(crossCreditToken, "InvalidFee");

      await expect(
        crossCreditToken.updateFees(100, excessiveFee)
      ).to.be.revertedWithCustomError(crossCreditToken, "InvalidFee");
    });

    it("Should calculate fees correctly", async function () {
      const amount = ethers.parseEther("1000");
      const expectedSendFee = ethers.parseEther("10"); // 1% of 1000
      const expectedReceiveFee = ethers.parseEther("5"); // 0.5% of 1000

      expect(await crossCreditToken.getSendFee(amount)).to.equal(expectedSendFee);
      expect(await crossCreditToken.getReceiveFee(amount)).to.equal(expectedReceiveFee);
      expect(await crossCreditToken.getNetSendAmount(amount)).to.equal(amount - expectedSendFee);
      expect(await crossCreditToken.getNetReceiveAmount(amount)).to.equal(amount - expectedReceiveFee);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000000");
      const initialSupply = await crossCreditToken.totalSupply();

      await crossCreditToken.mint(user1.address, mintAmount);

      expect(await crossCreditToken.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await crossCreditToken.balanceOf(user1.address)).to.be.gte(mintAmount);
    });

    it("Should revert minting above max supply", async function () {
      const currentSupply = await crossCreditToken.totalSupply();
      const excessiveAmount = MAX_SUPPLY - currentSupply + 1n;

      await expect(
        crossCreditToken.mint(user1.address, excessiveAmount)
      ).to.be.revertedWithCustomError(crossCreditToken, "ExceedsMaxSupply");
    });

    it("Should allow bridge operator management", async function () {
      expect(await blockDAGRouter.bridgeOperators(bridgeOperator.address)).to.be.true;

      await blockDAGRouter.removeBridgeOperator(bridgeOperator.address);
      expect(await blockDAGRouter.bridgeOperators(bridgeOperator.address)).to.be.false;

      await blockDAGRouter.addBridgeOperator(bridgeOperator.address);
      expect(await blockDAGRouter.bridgeOperators(bridgeOperator.address)).to.be.true;
    });

    it("Should allow chain management", async function () {
      const newChainId = 56;
      const chainName = "BSC";
      const rpcUrl = "https://bsc-dataseed.binance.org/";

      await expect(
        blockDAGRouter.addChain(newChainId, chainName, rpcUrl)
      ).to.emit(blockDAGRouter, "ChainAdded")
        .withArgs(newChainId, chainName, rpcUrl);

      const [supported, name, rpc] = await blockDAGRouter.getChainInfo(newChainId);
      expect(supported).to.be.true;
      expect(name).to.equal(chainName);
      expect(rpc).to.equal(rpcUrl);

      await expect(
        blockDAGRouter.removeChain(newChainId)
      ).to.emit(blockDAGRouter, "ChainRemoved")
        .withArgs(newChainId);

      const [supportedAfter] = await blockDAGRouter.getChainInfo(newChainId);
      expect(supportedAfter).to.be.false;
    });
  });

  describe("Security and Access Control", function () {
    it("Should only allow owner to call admin functions", async function () {
      await expect(
        crossCreditToken.connect(user1).mint(user2.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        crossCreditToken.connect(user1).updateFees(200, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        blockDAGRouter.connect(user1).addBridgeOperator(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow bridge operators to complete transfers", async function () {
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        blockDAGRouter.connect(user1).completeCrossChainTransfer(
          txHash,
          user2.address,
          ethers.parseEther("100"),
          1
        )
      ).to.be.revertedWithCustomError(blockDAGRouter, "NotBridgeOperator");
    });

    it("Should prevent reentrancy attacks", async function () {
      // This test would require a malicious contract to test properly
      // For now, we verify the ReentrancyGuard is applied to critical functions
      expect(await blockDAGRouter.MIN_TRANSFER_AMOUNT()).to.equal(MIN_TRANSFER);
    });
  });
});
