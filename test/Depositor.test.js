// SPDX-License-Identifier: MIT
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Depositor", function () {
  // Fixture to deploy the contract and set up initial state
  async function deployDepositorFixture() {
    const signers = await ethers.getSigners();
    if (signers.length < 6) {
      throw new Error("Insufficient signers available");
    }
    const [owner, user1, user2, beneficiary, mainRouter, unauthorized] = signers;

    // Validate signers
    [owner, user1, user2, beneficiary, mainRouter, unauthorized].forEach((signer, index) => {
      if (!signer || !signer.address) {
        throw new Error(`Signer at index ${index} is null or invalid`);
      }
    });

    // Deploy a mock ERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TST", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    if (!token.target) {
      throw new Error("MockERC20 deployment failed: contract address is null");
    }

    // Deploy a mock CCIP Router
    const MockRouter = await ethers.getContractFactory("MockRouter");
    const router = await MockRouter.deploy();
    await router.waitForDeployment();
    if (!router.target) {
      throw new Error("MockRouter deployment failed: contract address is null");
    }

    // Constants for the test
    const mainRouterChainSelector = 1234567890n;
    const mainRouterAddress = mainRouter.address;
    if (!mainRouterAddress) {
      throw new Error("mainRouterAddress is null");
    }

    // Deploy the Depositor contract
    const Depositor = await ethers.getContractFactory("Depositor");
    const depositor = await Depositor.deploy(
      router.target,
      mainRouterChainSelector,
      mainRouterAddress
    );
    await depositor.waitForDeployment();
    if (!depositor.target) {
      throw new Error("Depositor deployment failed: contract address is null");
    }

    // Fund Depositor with ETH for CCIP fees
    await owner.sendTransaction({ to: depositor.target, value: ethers.parseEther("1") });

    // Mint tokens to user1 for testing
    await token.connect(owner).transfer(user1.address, ethers.parseEther("1000"));

    return {
      depositor,
      token,
      router,
      owner,
      user1,
      user2,
      beneficiary,
      mainRouter,
      unauthorized,
      mainRouterChainSelector,
      mainRouterAddress,
    };
  }

  describe("Deployment", function () {
    it("should set the correct main router chain selector and address", async function () {
      const { depositor, mainRouterChainSelector, mainRouterAddress } = await loadFixture(deployDepositorFixture);
      expect(await depositor.MAIN_ROUTER_CHAIN_SELECTOR()).to.equal(mainRouterChainSelector);
      expect(await depositor.MAIN_ROUTER_ADDRESS()).to.equal(mainRouterAddress);
    });

    it("should set the owner as the deployer", async function () {
      const { depositor, owner } = await loadFixture(deployDepositorFixture);
      expect(await depositor.owner()).to.equal(owner.address);
    });

    it("should allowlist main router chain and address by default", async function () {
      const { depositor, mainRouterChainSelector, mainRouterAddress } = await loadFixture(deployDepositorFixture);
      expect(await depositor.allowlistedDestinationChains(mainRouterChainSelector)).to.be.true;
      expect(await depositor.allowlistedSenders(mainRouterAddress)).to.be.true;
    });

    it("should revert if router or main router address is zero", async function () {
      const { mainRouterChainSelector, mainRouterAddress, router } = await loadFixture(deployDepositorFixture);
      const Depositor = await ethers.getContractFactory("Depositor");
      await expect(
        Depositor.deploy(ethers.ZeroAddress, mainRouterChainSelector, mainRouterAddress)
      ).to.be.revertedWithCustomError(Depositor, "InvalidRouter");
      await expect(
        Depositor.deploy(router.target, mainRouterChainSelector, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Depositor, "ZeroAddress");
    });
  });

  describe("Administration", function () {
    it("should allow owner to allowlist a destination chain", async function () {
      const { depositor, owner } = await loadFixture(deployDepositorFixture);
      const chainSelector = 987654321n;
      await depositor.connect(owner).allowlistDestinationChain(chainSelector, true);
      expect(await depositor.allowlistedDestinationChains(chainSelector)).to.be.true;
      await depositor.connect(owner).allowlistDestinationChain(chainSelector, false);
      expect(await depositor.allowlistedDestinationChains(chainSelector)).to.be.false;
    });

    it("should allow owner to allowlist a source chain", async function () {
      const { depositor, owner } = await loadFixture(deployDepositorFixture);
      const chainSelector = 987654321n;
      await depositor.connect(owner).allowlistSourceChain(chainSelector, true);
      expect(await depositor.allowlistedSourceChains(chainSelector)).to.be.true;
      await depositor.connect(owner).allowlistSourceChain(chainSelector, false);
      expect(await depositor.allowlistedSourceChains(chainSelector)).to.be.false;
    });

    it("should allow owner to allowlist a sender", async function () {
      const { depositor, owner, user1 } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).allowlistSender(user1.address, true);
      expect(await depositor.allowlistedSenders(user1.address)).to.be.true;
      await depositor.connect(owner).allowlistSender(user1.address, false);
      expect(await depositor.allowlistedSenders(user1.address)).to.be.false;
    });

    it("should allow owner to add a supported token", async function () {
      const { depositor, owner, token } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).addSupportedToken(token.target);
      expect(await depositor.supportedTokens(token.target)).to.be.true;
      const tokenList = await depositor.getSupportedTokens();
      expect(tokenList).to.include(token.target);
    });

    it("should revert if non-owner tries to allowlist a destination chain", async function () {
      const { depositor, unauthorized } = await loadFixture(deployDepositorFixture);
      const chainSelector = 987654321n;
      await expect(
        depositor.connect(unauthorized).allowlistDestinationChain(chainSelector, true)
      ).to.be.revertedWith("Only callable by owner");
    });

    it("should revert if adding zero address as supported token", async function () {
      const { depositor, owner } = await loadFixture(deployDepositorFixture);
      await expect(
        depositor.connect(owner).addSupportedToken(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(depositor, "ZeroAddress");
    });
  });

  describe("Token Deposits", function () {
    it("should allow user to deposit supported tokens", async function () {
      const { depositor, token, user1, owner, mainRouterChainSelector, mainRouterAddress } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");

      // Add token as supported
      await depositor.connect(owner).addSupportedToken(token.target);

      // Approve tokens
      await token.connect(user1).approve(depositor.target, amount);

      // Deposit tokens
      const tx = await depositor.connect(user1).depositToken(token.target, amount);
      await expect(tx)
        .to.emit(depositor, "TokenDeposited")
        .withArgs(user1.address, token.target, amount, ethers.isBytesLike);
      await expect(tx)
        .to.emit(depositor, "MessageSent")
        .withArgs(ethers.isBytesLike, mainRouterChainSelector, mainRouterAddress, ethers.parseEther("0.01"));

      expect(await depositor.getUserDeposit(user1.address, token.target)).to.equal(amount);
      expect(await token.balanceOf(depositor.target)).to.equal(amount);
    });

    it("should revert if depositing zero amount", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).addSupportedToken(token.target);
      await expect(
        depositor.connect(user1).depositToken(token.target, 0)
      ).to.be.revertedWithCustomError(depositor, "ZeroAmount");
    });

    it("should revert if token is not supported", async function () {
      const { depositor, token, user1 } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");
      await expect(
        depositor.connect(user1).depositToken(token.target, amount)
      ).to.be.revertedWithCustomError(depositor, "TokenNotSupported").withArgs(token.target);
    });

    it("should revert if user has insufficient token balance", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("2000");
      await depositor.connect(owner).addSupportedToken(token.target);
      await token.connect(user1).approve(depositor.target, amount);
      await expect(
        depositor.connect(user1).depositToken(token.target, amount)
      ).to.be.revertedWithCustomError(depositor, "InsufficientTokenBalance").withArgs(amount, ethers.parseEther("1000"));
    });

    it("should revert if contract has insufficient ETH for CCIP fees", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");

      // Add token as supported
      await depositor.connect(owner).addSupportedToken(token.target);

      // Approve tokens
      await token.connect(user1).approve(depositor.target, amount);

      // Withdraw all ETH from contract
      await depositor.connect(owner).withdraw(owner.address);

      await expect(
        depositor.connect(user1).depositToken(token.target, amount)
      ).to.be.revertedWithCustomError(depositor, "NotEnoughBalance");
    });
  });

  describe("Token Withdrawals", function () {
    it("should allow user to withdraw deposited tokens", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");

      // Add token as supported
      await depositor.connect(owner).addSupportedToken(token.target);

      // Deposit tokens
      await token.connect(user1).approve(depositor.target, amount);
      await depositor.connect(user1).depositToken(token.target, amount);

      // Withdraw tokens
      await expect(depositor.connect(user1)["withdrawToken(address,uint256)"](token.target, amount))
        .to.emit(depositor, "TokenWithdrawn")
        .withArgs(user1.address, token.target, amount);

      expect(await depositor.getUserDeposit(user1.address, token.target)).to.equal(0);
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("should revert if withdrawing zero amount", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).addSupportedToken(token.target);
      await expect(
        depositor.connect(user1)["withdrawToken(address,uint256)"](token.target, 0)
      ).to.be.revertedWithCustomError(depositor, "ZeroAmount");
    });

    it("should revert if user has insufficient deposited balance", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");
      await depositor.connect(owner).addSupportedToken(token.target);
      await expect(
        depositor.connect(user1)["withdrawToken(address,uint256)"](token.target, amount)
      ).to.be.revertedWithCustomError(depositor, "InsufficientTokenBalance").withArgs(amount, 0);
    });

    it("should revert if token is not supported", async function () {
      const { depositor, token, user1 } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");
      await expect(
        depositor.connect(user1)["withdrawToken(address,uint256)"](token.target, amount)
      ).to.be.revertedWithCustomError(depositor, "TokenNotSupported").withArgs(token.target);
    });
  });

  describe("CCIP Messaging", function () {
    async function impersonateRouter(routerAddress, provider) {
      // Fund the router address with ETH to allow transaction sending
      // Convert BigInt to hex string properly
      const ethAmount = ethers.parseEther("1");
      const hexAmount = "0x" + ethAmount.toString(16);
      await provider.send("hardhat_setBalance", [routerAddress, hexAmount]);
      // Impersonate the router address
      await provider.send("hardhat_impersonateAccount", [routerAddress]);
      return ethers.getSigner(routerAddress);
    }

    it("should receive and process incoming CCIP messages from allowlisted sender", async function () {
      const { depositor, router, owner, mainRouter, mainRouterChainSelector } = await loadFixture(deployDepositorFixture);
      const messageId = ethers.randomBytes(32);
      const message = "test message";

      // Allowlist source chain
      await depositor.connect(owner).allowlistSourceChain(mainRouterChainSelector, true);

      // Impersonate the router
      const routerSigner = await impersonateRouter(router.target, ethers.provider);

      // Simulate CCIP message receipt from router
      const any2EvmMessage = {
        messageId: messageId,
        sourceChainSelector: mainRouterChainSelector,
        sender: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [mainRouter.address]),
        data: ethers.AbiCoder.defaultAbiCoder().encode(["string"], [message]),
        destTokenAmounts: []
      };

      await expect(
        depositor.connect(routerSigner).ccipReceive(any2EvmMessage)
      )
        .to.emit(depositor, "MessageReceived")
        .withArgs(messageId, mainRouterChainSelector, mainRouter.address, message);

      // Stop impersonating
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [router.target]);
    });

    it("should revert if source chain is not allowlisted", async function () {
      const { depositor, router, mainRouter } = await loadFixture(deployDepositorFixture);
      const messageId = ethers.randomBytes(32);
      const invalidChainSelector = 999999999n;
      const message = "test message";

      // Impersonate the router
      const routerSigner = await impersonateRouter(router.target, ethers.provider);

      const any2EvmMessage = {
        messageId: messageId,
        sourceChainSelector: invalidChainSelector,
        sender: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [mainRouter.address]),
        data: ethers.AbiCoder.defaultAbiCoder().encode(["string"], [message]),
        destTokenAmounts: []
      };

      await expect(
        depositor.connect(routerSigner).ccipReceive(any2EvmMessage)
      ).to.be.revertedWithCustomError(depositor, "SourceChainNotAllowed").withArgs(invalidChainSelector);

      // Stop impersonating
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [router.target]);
    });

    it("should revert if sender is not allowlisted", async function () {
      const { depositor, router, owner, unauthorized, mainRouterChainSelector } = await loadFixture(deployDepositorFixture);
      const messageId = ethers.randomBytes(32);
      const message = "test message";

      // Allowlist source chain
      await depositor.connect(owner).allowlistSourceChain(mainRouterChainSelector, true);

      // Impersonate the router
      const routerSigner = await impersonateRouter(router.target, ethers.provider);

      const any2EvmMessage = {
        messageId: messageId,
        sourceChainSelector: mainRouterChainSelector,
        sender: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [unauthorized.address]),
        data: ethers.AbiCoder.defaultAbiCoder().encode(["string"], [message]),
        destTokenAmounts: []
      };

      await expect(
        depositor.connect(routerSigner).ccipReceive(any2EvmMessage)
      ).to.be.revertedWithCustomError(depositor, "SenderNotAllowed").withArgs(unauthorized.address);

      // Stop impersonating
      await ethers.provider.send("hardhat_stopImpersonatingAccount", [router.target]);
    });
  });

  describe("Emergency Functions", function () {
    it("should allow owner to withdraw ETH", async function () {
      const { depositor, owner, beneficiary } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("0.5");

      // Send additional ETH to contract
      await owner.sendTransaction({ to: depositor.target, value: amount });

      const initialBalance = await ethers.provider.getBalance(beneficiary.address);
      await depositor.connect(owner).withdraw(beneficiary.address);
      const finalBalance = await ethers.provider.getBalance(beneficiary.address);

      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1.5")); // 1 ETH from fixture + 0.5 ETH
    });

    it("should allow owner to withdraw tokens", async function () {
      const { depositor, token, owner, beneficiary } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");

      // Send tokens to contract
      await token.connect(owner).transfer(depositor.target, amount);

      await depositor.connect(owner)["withdrawToken(address,address)"](beneficiary.address, token.target);
      expect(await token.balanceOf(beneficiary.address)).to.equal(amount);
    });

    it("should revert if withdrawing zero ETH", async function () {
      const { depositor, owner, beneficiary } = await loadFixture(deployDepositorFixture);
      // Withdraw all ETH first
      await depositor.connect(owner).withdraw(owner.address);
      await expect(
        depositor.connect(owner).withdraw(beneficiary.address)
      ).to.be.revertedWithCustomError(depositor, "NothingToWithdraw");
    });

    it("should revert if withdrawing zero tokens", async function () {
      const { depositor, token, owner, beneficiary } = await loadFixture(deployDepositorFixture);
      await expect(
        depositor.connect(owner)["withdrawToken(address,address)"](beneficiary.address, token.target)
      ).to.be.revertedWithCustomError(depositor, "NothingToWithdraw");
    });

    it("should revert if non-owner tries to withdraw ETH", async function () {
      const { depositor, unauthorized, beneficiary } = await loadFixture(deployDepositorFixture);
      await expect(
        depositor.connect(unauthorized).withdraw(beneficiary.address)
      ).to.be.revertedWith("Only callable by owner");
    });
  });

  describe("View Functions", function () {
    it("should return correct user deposit amount", async function () {
      const { depositor, token, user1, owner } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");

      await depositor.connect(owner).addSupportedToken(token.target);
      await token.connect(user1).approve(depositor.target, amount);
      await depositor.connect(user1).depositToken(token.target, amount);

      expect(await depositor.getUserDeposit(user1.address, token.target)).to.equal(amount);
    });

    it("should return supported tokens list", async function () {
      const { depositor, token, owner } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).addSupportedToken(token.target);
      const tokenList = await depositor.getSupportedTokens();
      expect(tokenList).to.include(token.target);
    });

    it("should return correct token support status", async function () {
      const { depositor, token, owner, user1 } = await loadFixture(deployDepositorFixture);
      await depositor.connect(owner).addSupportedToken(token.target);
      expect(await depositor.isTokenSupported(token.target)).to.be.true;
      expect(await depositor.isTokenSupported(user1.address)).to.be.false;
    });

    it("should return correct deposit message fee", async function () {
      const { depositor, token, user1 } = await loadFixture(deployDepositorFixture);
      const amount = ethers.parseEther("100");
      const fee = await depositor.getDepositMessageFee(user1.address, token.target, amount);
      expect(fee).to.equal(ethers.parseEther("0.01")); // MockRouter returns 0.01 ETH
    });
  })
});