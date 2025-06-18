import { expect } from "chai";
import { ethers } from "hardhat";

// Mock contracts for testing
const MockRouterClientABI = [
  "function getFee(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, bytes extraArgs) external view returns (uint256)",
  "function ccipSend(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, bytes extraArgs, address feeToken) external payable returns (bytes32)",
];
const MockERC20ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

describe("Depositor", function () {
  let Depositor, depositor;
  let MockRouterClient, mockRouter;
  let MockERC20, mockToken;
  let owner, user1, user2, mainRouter, unauthorized;
  const MAIN_ROUTER_CHAIN_SELECTOR = 1234567890n; // Example chain selector
  const TOKEN_AMOUNT = ethers.parseUnits("100", 18);
  const INITIAL_BALANCE = ethers.parseUnits("1000", 18);

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, mainRouter, unauthorized] = await ethers.getSigners();

    // Deploy mock RouterClient
    MockRouterClient = await ethers.getContractFactoryFromArtifact({
      abi: MockRouterClientABI,
      bytecode: {
        object: "0x608060405234801561001057600080fd5b506101be806100206000396000f3fe60806040526000366000803760008036600060405160200161009c5760405162461bcd60e51b815260206004820152602660248201527f546869732069732061206d6f636b20636f6e747261637420666f722074657374696e60448201526567206f6e6c7960c01b6064820152608401600080fd5b60008036818060006040516020016100c45760405162461bcd60e51b8152600401600080fd5b60408051602081018390527f00000000000000000000000000000000000000000000000000000000000000c8815260006020820152600160408201526000908101905060006001600160a01b0316630f2d83a960e01b8252600482015260248101829052604481018290526000606482018190526000608482015260a482019390935260c401602060405180830381855afa15801561015d573d6000803e3d6000fd5b5050506040513d601f19601f8201168201806040525081019061017f9190610186565b91509150935093509350935093565b60006020828403121561019857600080fd5b81516001600160a01b03811681146101af57600080fd5b9392505050565b60e4806101bc6000396000f3fe",
      },
    });
    mockRouter = await MockRouterClient.deploy();
    await mockRouter.waitForDeployment();

    // Deploy mock ERC20 token
    MockERC20 = await ethers.getContractFactoryFromArtifact({
      abi: MockERC20ABI,
      bytecode: {
        object: "0x608060405234801561001057600080fd5b5061030f806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c8063095ea7b31461005157806370a0823114610076578063a9059cbb1461009b578063dd62ed3e146100c0575b600080fd5b61006461005f3660046101e7565b6100e8565b60405190151581526020015b60405180910390f35b61008e610084366004610211565b60016020526000908152604090205481565b60405190815260200161006d575b6100646100a93660046101e7565b61011e565b61008e6100ce366004610233565b60026020526000908152604090205481565b6001600160a01b0383166000908152600260205260408120541115610115576001600160a01b0383166000908152600160205260409020548082111561011557600080fd5b5061011b8284610272565b5060015b92915050565b6001600160a01b0383166000908152600160205260408120548082111561013e57600080fd5b6001600160a01b03831660009081526001602052604090205461015e90836102a4565b6001600160a01b038416600090815260016020908152604090912082905561018290836102bc565b5060015b92915050565b80356001600160a01b038116811461019f57600080fd5b919050565b60008083601f8401126101b657600080fd5b50813567ffffffffffffffff8111156101ce57600080fd5b6020830191508360208285010111156101e657600080fd5b505050505050565b600080604083850312156101fa57600080fd5b61020383610188565b91506101e68260208401610188565b60006020828403121561022357600080fd5b61022c82610188565b9392505050565b6000806040838503121561024657600080fd5b61024f83610188565b915061025d60208401610188565b90509250929050565b60008282101561028257634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052601160045260246000fd5b600082198211156102b7576102b7610289565b500190565b60008160001904831182151516156102d6576102d6610289565b500290565b80356001600160a01b038116811461019f57600080fd5b919050565b60006020828403121561030257600080fd5b61022c826102de565b60006020828403121561031e57600080fd5b5035919050565b60006020828403121561033757600080fd5b813567ffffffffffffffff81111561034e57600080fd5b8201604084015261035f816101a4565b5061036c60208285016102de565b91505092915050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff811182821017156103b2576103b2610375565b60405290565b600067ffffffffffffffff8211156103d2576103d2610375565b5060051b60200190565b6000604082840312156103ee57600080fd5b6103f6610389565b9050813567ffffffffffffffff81111561040f57600080fd5b8201601f8101841361042057600080fd5b61042f84825160208460051b016103b8565b50949350505050565b6000806040838503121561044e57600080fd5b610457836102de565b9150610465602084016102de565b90509250929050565b60006020828403121561048057600080fd5b813567ffffffffffffffff81111561049757600080fd5b6104a384828501610375565b94935050505056",
      },
    });
    mockToken = await MockERC20.deploy();
    await mockToken.waitForDeployment();

    // Set up mock token balance for user1
    await mockToken.connect(user1).approve(user1.address, INITIAL_BALANCE);
    await mockToken.connect(user1).transfer(user1.address, INITIAL_BALANCE);

    // Deploy Depositor contract
    Depositor = await ethers.getContractFactory("Depositor");
    depositor = await Depositor.deploy(
      mockRouter.address,
      MAIN_ROUTER_CHAIN_SELECTOR,
      mainRouter.address
    );
    await depositor.waitForDeployment();

    // Add supported token
    await depositor.connect(owner).addSupportedToken(mockToken.address);
  });

  describe("Deployment", function () {
    it("should deploy successfully with correct parameters", async function () {
      expect(depositor.target).to.be.properAddress;
      expect(await depositor.s_router()).to.equal(mockRouter.address);
      expect(await depositor.MAIN_ROUTER_CHAIN_SELECTOR()).to.equal(MAIN_ROUTER_CHAIN_SELECTOR);
      expect(await depositor.MAIN_ROUTER_ADDRESS()).to.equal(mainRouter.address);
      expect(await depositor.allowlistedDestinationChains(MAIN_ROUTER_CHAIN_SELECTOR)).to.be.true;
      expect(await depositor.allowlistedSenders(mainRouter.address)).to.be.true;
      expect(await depositor.isTokenSupported(mockToken.address)).to.be.true;
    });

    it("should revert if router is zero address", async function () {
      await expect(
        Depositor.deploy(ethers.ZeroAddress, MAIN_ROUTER_CHAIN_SELECTOR, mainRouter.address)
      ).to.be.revertedWithCustomError(Depositor, "ZeroAddress");
    });

    it("should revert if mainRouterAddress is zero address", async function () {
      await expect(
        Depositor.deploy(mockRouter.address, MAIN_ROUTER_CHAIN_SELECTOR, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Depositor, "ZeroAddress");
    });
  });

  describe("Administration", function () {
    it("should allowlist a destination chain", async function () {
      const newChainSelector = 9876543210n;
      await depositor.connect(owner).allowlistDestinationChain(newChainSelector, true);
      expect(await depositor.allowlistedDestinationChains(newChainSelector)).to.be.true;
    });

    it("should allowlist a source chain", async function () {
      const newSourceChain = 54321n;
      await depositor.connect(owner).allowlistSourceChain(newSourceChain, true);
      expect(await depositor.allowlistedSourceChains(newSourceChain)).to.be.true;
    });

    it("should allowlist a sender", async function () {
      await depositor.connect(owner).allowlistSender(user1.address, true);
      expect(await depositor.allowlistedSenders(user1.address)).to.be.true;
    });

    it("should add a supported token", async function () {
      const newToken = (await MockERC20.deploy()).target;
      await depositor.connect(owner).addSupportedToken(newToken);
      expect(await depositor.isTokenSupported(newToken)).to.be.true;
      const supportedTokens = await depositor.getSupportedTokens();
      expect(supportedTokens).to.include(newToken);
    });

    it("should remove a supported token", async function () {
      await depositor.connect(owner).removeSupportedToken(mockToken.address);
      expect(await depositor.isTokenSupported(mockToken.address)).to.be.false;
      const supportedTokens = await depositor.getSupportedTokens();
      expect(supportedTokens).to.not.include(mockToken.address);
    });

    it("should revert if non-owner tries to add supported token", async function () {
      await expect(
        depositor.connect(user1).addSupportedToken(mockToken.address)
      ).to.be.revertedWithCustomError(depositor, "OwnableUnauthorizedAccount");
    });

    it("should revert if adding zero address as supported token", async function () {
      await expect(
        depositor.connect(owner).addSupportedToken(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(depositor, "ZeroAddress");
    });
  });

  describe("Token Deposits", function () {
    beforeEach(async function () {
      // Approve tokens for depositor
      await mockToken.connect(user1).approve(depositor.target, TOKEN_AMOUNT);
    });

    it("should deposit tokens successfully", async function () {
      const initialBalance = await mockToken.balanceOf(user1.address);
      const tx = await depositor.connect(user1).depositToken(mockToken.address, TOKEN_AMOUNT);
      const receipt = await tx.wait();

      // Check user deposit tracking
      expect(await depositor.getUserDeposit(user1.address, mockToken.address)).to.equal(TOKEN_AMOUNT);
      expect(await mockToken.balanceOf(depositor.target)).to.equal(TOKEN_AMOUNT);
      expect(await mockToken.balanceOf(user1.address)).to.equal(initialBalance - TOKEN_AMOUNT);

      // Check event
      await expect(tx)
        .to.emit(depositor, "TokenDeposited")
        .withArgs(user1.address, mockToken.address, TOKEN_AMOUNT, ethers.HashZero); // Mock router returns 0
    });

    it("should revert if token is not supported", async function () {
      const unsupportedToken = (await MockERC20.deploy()).target;
      await expect(
        depositor.connect(user1).depositToken(unsupportedToken, TOKEN_AMOUNT)
      ).to.be.revertedWithCustomError(depositor, "TokenNotSupported");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        depositor.connect(user1).depositToken(mockToken.address, 0)
      ).to.be.revertedWithCustomError(depositor, "ZeroAmount");
    });

    it("should revert if insufficient token balance", async function () {
      const largeAmount = INITIAL_BALANCE + 1n;
      await expect(
        depositor.connect(user1).depositToken(mockToken.address, largeAmount)
      ).to.be.revertedWithCustomError(depositor, "InsufficientTokenBalance");
    });
  });

  describe("Token Withdrawals", function () {
    beforeEach(async function () {
      await mockToken.connect(user1).approve(depositor.target, TOKEN_AMOUNT);
      await depositor.connect(user1).depositToken(mockToken.address, TOKEN_AMOUNT);
    });

    it("should withdraw tokens successfully", async function () {
      const initialBalance = await mockToken.balanceOf(user1.address);
      const tx = await depositor.connect(user1).withdrawToken(mockToken.address, TOKEN_AMOUNT);
      const receipt = await tx.wait();

      // Check user deposit tracking
      expect(await depositor.getUserDeposit(user1.address, mockToken.address)).to.equal(0);
      expect(await mockToken.balanceOf(depositor.target)).to.equal(0);
      expect(await mockToken.balanceOf(user1.address)).to.equal(initialBalance + TOKEN_AMOUNT);

      // Check event
      await expect(tx)
        .to.emit(depositor, "TokenWithdrawn")
        .withArgs(user1.address, mockToken.address, TOKEN_AMOUNT);
    });

    it("should revert if insufficient deposited amount", async function () {
      const largeAmount = TOKEN_AMOUNT + 1n;
      await expect(
        depositor.connect(user1).withdrawToken(mockToken.address, largeAmount)
      ).to.be.revertedWithCustomError(depositor, "InsufficientTokenBalance");
    });

    it("should revert if token is not supported", async function () {
      const unsupportedToken = (await MockERC20.deploy()).target;
      await expect(
        depositor.connect(user1).withdrawToken(unsupportedToken, TOKEN_AMOUNT)
      ).to.be.revertedWithCustomError(depositor, "TokenNotSupported");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        depositor.connect(user1).withdrawToken(mockToken.address, 0)
      ).to.be.revertedWithCustomError(depositor, "ZeroAmount");
    });
  });

  describe("Emergency Withdrawals", function () {
    it("should withdraw ETH successfully", async function () {
      // Send ETH to contract
      const ethAmount = ethers.parseEther("1");
      await owner.sendTransaction({ to: depositor.target, value: ethAmount });
      const initialBalance = await ethers.provider.getBalance(owner.address);

      const tx = await depositor.connect(owner).withdraw(owner.address);
      const receipt = await tx.wait();

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(initialBalance + ethAmount, ethers.parseEther("0.01"));
    });

    it("should withdraw tokens successfully as owner", async function () {
      await mockToken.connect(user1).approve(depositor.target, TOKEN_AMOUNT);
      await depositor.connect(user1).depositToken(mockToken.address, TOKEN_AMOUNT);

      const initialBalance = await mockToken.balanceOf(owner.address);
      const tx = await depositor.connect(owner).withdrawToken(owner.address, mockToken.address);
      const receipt = await tx.wait();

      expect(await mockToken.balanceOf(owner.address)).to.equal(initialBalance + TOKEN_AMOUNT);
      expect(await mockToken.balanceOf(depositor.target)).to.equal(0);
    });

    it("should revert if non-owner tries to withdraw ETH", async function () {
      await expect(
        depositor.connect(user1).withdraw(user1.address)
      ).to.be.revertedWithCustomError(depositor, "OwnableUnauthorizedAccount");
    });

    it("should revert if nothing to withdraw (ETH)", async function () {
      await expect(
        depositor.connect(owner).withdraw(owner.address)
      ).to.be.revertedWithCustomError(depositor, "NothingToWithdraw");
    });

    it("should revert if nothing to withdraw (token)", async function () {
      await expect(
        depositor.connect(owner).withdrawToken(owner.address, mockToken.address)
      ).to.be.revertedWithCustomError(depositor, "NothingToWithdraw");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await mockToken.connect(user1).approve(depositor.target, TOKEN_AMOUNT);
      await depositor.connect(user1).depositToken(mockToken.address, TOKEN_AMOUNT);
    });

    it("should return user deposit amount", async function () {
      expect(await depositor.getUserDeposit(user1.address, mockToken.address)).to.equal(TOKEN_AMOUNT);
    });

    it("should return supported tokens", async function () {
      const supportedTokens = await depositor.getSupportedTokens();
      expect(supportedTokens).to.include(mockToken.address);
    });

    it("should return token support status", async function () {
      expect(await depositor.isTokenSupported(mockToken.address)).to.be.true;
      const unsupportedToken = (await MockERC20.deploy()).target;
      expect(await depositor.isTokenSupported(unsupportedToken)).to.be.false;
    });
  });
});