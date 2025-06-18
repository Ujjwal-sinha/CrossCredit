import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;


describe("MainRouter Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployMainRouterFixture() {
    // Mock contracts
    const mockRouter = await ethers.deployContract("MockRouter");
    const mockFunctionsRouter = await ethers.deployContract("MockFunctionsRouter");
    const mockPriceFeed = await ethers.deployContract("MockAggregatorV3");
    
    // Deploy MainRouter
    const MainRouter = await ethers.getContractFactory("MainRouter");
    const mainRouter = await MainRouter.deploy(
      await mockRouter.getAddress(),
      await mockFunctionsRouter.getAddress(),
      ethers.encodeBytes32String("donId"),
      1 // subscriptionId
    );

    const [owner, user1, user2] = await ethers.getSigners();

    return { mainRouter, mockRouter, mockFunctionsRouter, mockPriceFeed, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { mainRouter, owner } = await loadFixture(deployMainRouterFixture);
      expect(await mainRouter.owner()).to.equal(owner.address);
    });

    it("Should set initial constants correctly", async function () {
      const { mainRouter } = await loadFixture(deployMainRouterFixture);
      expect(await mainRouter.MIN_HEALTH_FACTOR()).to.equal(ethers.parseEther("1.5"));
      expect(await mainRouter.MAX_LTV()).to.equal(75);
      expect(await mainRouter.CREDIT_SCORE_MULTIPLIER()).to.equal(10);
    });
  });

  describe("Allowlisting", function () {
    it("Should allow owner to manage allowlists", async function () {
      const { mainRouter, owner, user1 } = await loadFixture(deployMainRouterFixture);
      
      // Test destination chain allowlisting
      const chainSelector = 1;
      await expect(mainRouter.connect(owner).allowlistDestinationChain(chainSelector, true))
        .to.emit(mainRouter, "DestinationChainAllowlisted")
        .withArgs(chainSelector, true);
      
      expect(await mainRouter.allowlistedDestinationChains(chainSelector)).to.be.true;

      // Test sender allowlisting
      await expect(mainRouter.connect(owner).allowlistSender(user1.address, true))
        .to.emit(mainRouter, "SenderAllowlisted")
        .withArgs(user1.address, true);
      
      expect(await mainRouter.allowlistedSenders(user1.address)).to.be.true;
    });

    it("Should prevent non-owners from managing allowlists", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      await expect(mainRouter.connect(user1).allowlistDestinationChain(1, true))
        .to.be.revertedWith("Only callable by owner");
    });
  });

  describe("Price Feed Management", function () {
    it("Should allow owner to set price feeds", async function () {
      const { mainRouter, owner, mockPriceFeed } = await loadFixture(deployMainRouterFixture);
      const tokenAddress = owner.address; // Using owner address as mock token
      
      await expect(mainRouter.connect(owner).setPriceFeed(tokenAddress, await mockPriceFeed.getAddress()))
        .to.emit(mainRouter, "PriceFeedSet")
        .withArgs(tokenAddress, await mockPriceFeed.getAddress());
      
      expect(await mainRouter.priceFeeds(tokenAddress)).to.equal(await mockPriceFeed.getAddress());
    });
  });

  describe("Deposit Processing", function () {
    it("Should process deposits correctly", async function () {
      const { mainRouter, user1, mockPriceFeed } = await loadFixture(deployMainRouterFixture);
      
      // Setup
      const tokenAddress = user1.address; // Using user1 address as mock token
      const amount = ethers.parseEther("100");
      const sourceChain = 1;
      
      // Set price feed
      await mainRouter.setPriceFeed(tokenAddress, await mockPriceFeed.getAddress());
      await mockPriceFeed.setPrice(ethers.parseUnits("1", 8)); // $1 price
      
      // Process deposit
      await expect(mainRouter.processDeposit(user1.address, tokenAddress, amount, sourceChain))
        .to.emit(mainRouter, "DepositReceived")
        .withArgs(user1.address, tokenAddress, amount, sourceChain);
      
      // Verify state
      expect(await mainRouter.userDeposits(user1.address, tokenAddress)).to.equal(amount);
      const profile = await mainRouter.userProfiles(user1.address);
      expect(profile.totalDeposited).to.equal(amount);
      expect(profile.lastUpdated).to.be.gt(0);
    });
  });

  describe("Borrow Approval", function () {
    it("Should approve borrow when requirements are met", async function () {
      const { mainRouter, user1, mockPriceFeed } = await loadFixture(deployMainRouterFixture);
      
      // Setup
      const tokenAddress = user1.address; // Using user1 address as mock token
      const depositAmount = ethers.parseEther("100");
      const borrowAmount = ethers.parseEther("50");
      const sourceChain = 1;
      const destChain = 2;
      
      // Set price feed and allowlist chain
      await mainRouter.setPriceFeed(tokenAddress, await mockPriceFeed.getAddress());
      await mockPriceFeed.setPrice(ethers.parseUnits("1", 8)); // $1 price
      await mainRouter.allowlistDestinationChain(destChain, true);
      
      // Set credit score
      await mainRouter.setCreditScore(user1.address, 800); // Good credit score
      
      // Process deposit
      await mainRouter.processDeposit(user1.address, tokenAddress, depositAmount, sourceChain);
      
      // Approve borrow
      await expect(mainRouter.approveBorrow(user1.address, borrowAmount, destChain))
        .to.emit(mainRouter, "BorrowApproved")
        .withArgs(user1.address, borrowAmount, destChain, 800);
      
      // Verify state
      expect(await mainRouter.userBorrows(user1.address)).to.equal(borrowAmount);
      const profile = await mainRouter.userProfiles(user1.address);
      expect(profile.totalBorrowed).to.equal(borrowAmount);
      expect(profile.healthFactor).to.be.gt(await mainRouter.MIN_HEALTH_FACTOR());
    });

    it("Should reject borrow with insufficient credit score", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      // Allowlist the destination chain first
      const destChain = 1;
      await mainRouter.allowlistDestinationChain(destChain, true);
      
      // Set low credit score
      await mainRouter.setCreditScore(user1.address, 400);
      
      await expect(mainRouter.approveBorrow(user1.address, 100, destChain))
        .to.be.revertedWithCustomError(mainRouter, "InvalidCreditScore");
    });

    it("Should reject borrow with insufficient collateral", async function () {
      const { mainRouter, user1, mockPriceFeed } = await loadFixture(deployMainRouterFixture);
      
      // Setup
      const destChain = 1;
      await mainRouter.allowlistDestinationChain(destChain, true); // Allowlist destination chain
      await mainRouter.setPriceFeed(user1.address, await mockPriceFeed.getAddress());
      await mockPriceFeed.setPrice(ethers.parseUnits("1", 8)); // $1 price
      await mainRouter.setCreditScore(user1.address, 800);
      
      // Small deposit
      await mainRouter.processDeposit(user1.address, user1.address, ethers.parseEther("10"), 1);
      
      // Large borrow request
      await expect(mainRouter.approveBorrow(user1.address, ethers.parseEther("20"), destChain))
        .to.be.revertedWithCustomError(mainRouter, "InsufficientCollateral");
    });
  });

  describe("Credit Score Management", function () {
    it("Should update credit scores correctly", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      const newScore = 750;
      await expect(mainRouter.setCreditScore(user1.address, newScore))
        .to.emit(mainRouter, "CreditScoreUpdated")
        .withArgs(user1.address, newScore);
      
      expect(await mainRouter.getUserCreditScore(user1.address)).to.equal(newScore);
    });

    it("Should cap credit score at 1000", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      await mainRouter.setCreditScore(user1.address, 1500);
      expect(await mainRouter.getUserCreditScore(user1.address)).to.equal(1000);
    });
  });

  describe("Health Factor Calculations", function () {
    it("Should calculate health factor correctly", async function () {
      const { mainRouter, user1, mockPriceFeed } = await loadFixture(deployMainRouterFixture);
      
      // Setup
      const destChain = 1;
      await mainRouter.allowlistDestinationChain(destChain, true); // Allowlist destination chain
      await mainRouter.setPriceFeed(user1.address, await mockPriceFeed.getAddress());
      await mockPriceFeed.setPrice(ethers.parseUnits("1", 8)); // $1 price
      await mainRouter.setCreditScore(user1.address, 800);
      
      // Deposit $100
      await mainRouter.processDeposit(user1.address, user1.address, ethers.parseEther("100"), 1);
      
      // Borrow $50
      await mainRouter.approveBorrow(user1.address, ethers.parseEther("50"), destChain);
      
      // Expected HF: ($100 * 0.8) / $50 = 1.6
      const healthFactor = await mainRouter.getHealthFactor(user1.address);
      expect(healthFactor).to.be.closeTo(ethers.parseEther("1.6"), ethers.parseEther("0.01"));
    });

    it("Should return max uint256 for users with no debt", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      const healthFactor = await mainRouter.getHealthFactor(user1.address);
      expect(healthFactor).to.equal(ethers.MaxUint256);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw ETH", async function () {
      const { mainRouter, owner, user1 } = await loadFixture(deployMainRouterFixture);
      
      // Send ETH to contract
      await owner.sendTransaction({
        to: await mainRouter.getAddress(),
        value: ethers.parseEther("1")
      });
      
      await expect(mainRouter.connect(owner).withdraw(user1.address))
        .to.changeEtherBalances(
          [await mainRouter.getAddress(), user1.address],
          [ethers.parseEther("-1"), ethers.parseEther("1")]
        );
    });

    it("Should prevent non-owners from withdrawing", async function () {
      const { mainRouter, user1 } = await loadFixture(deployMainRouterFixture);
      
      await expect(mainRouter.connect(user1).withdraw(user1.address))
        .to.be.revertedWith("Only callable by owner");
    });
  });
});