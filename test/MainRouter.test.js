import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("MainRouter Core Functionality", function () {
  let MainRouter, mainRouter;
  let owner, user;
  let mockRouter, mockToken;

  const CHAIN_SELECTOR = 1;
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 18);
  const BORROW_AMOUNT = ethers.parseUnits("500", 18);

  before(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mocks
    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy();
    
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MOCK", 18);
    await mockToken.mint(user.address, DEPOSIT_AMOUNT * 2n);

    // Deploy MainRouter
    MainRouter = await ethers.getContractFactory("MainRouter");
    mainRouter = await MainRouter.deploy(
      mockRouter.address,
      ethers.ZeroAddress, // No FunctionsRouter for this test
      ethers.ZeroHash, // No DON ID
      0 // No subscription ID
    );

    // Setup allowlists
    await mainRouter.allowlistSourceChain(CHAIN_SELECTOR, true);
    await mainRouter.allowlistSender(mockRouter.address, true);
    await mainRouter.allowlistDestinationChain(CHAIN_SELECTOR, true);

    // Set price feed (1:1 price)
    const MockAggregator = await ethers.getContractFactory("MockAggregator");
    const mockPriceFeed = await MockAggregator.deploy();
    await mockPriceFeed.setLatestAnswer(ethers.utils.parseUnits("1", 8));
    await mainRouter.setPriceFeed(mockToken.address, mockPriceFeed.address);

    // Fund contract with ETH for fees
    await owner.sendTransaction({
      to: mainRouter.address,
      value: ethers.utils.parseEther("1")
    });
  });

  it("should process deposits and allow borrowing", async function () {
    // 1. Simulate deposit from another chain
    await mockRouter.simulateCCIPReceive(
      mainRouter.address,
      CHAIN_SELECTOR,
      mockRouter.address,
      ethers.utils.defaultAbiCoder.encode(
        ["string"],
        [`${user.address},${mockToken.address},${DEPOSIT_AMOUNT},0`]
      )
    );

    // Verify deposit was recorded
    expect(await mainRouter.userDeposits(user.address, mockToken.address))
      .to.equal(DEPOSIT_AMOUNT);

    // 2. Set credit score (simulate Functions response)
    await mainRouter.connect(owner).allowlistSender(owner.address, true);
    await mainRouter.connect(owner).requestCreditScoreUpdate(
      user.address, 
      "dummy source"
    );
    
    // Mock credit score response (800/1000)
    const creditScore = 800;
    await mainRouter.connect(owner).fulfillRequest(
      await mainRouter.lastRequestId(),
      ethers.utils.defaultAbiCoder.encode(["uint256"], [creditScore]),
      "0x"
    );

    // 3. Approve borrow
    await expect(mainRouter.connect(owner).approveBorrow(
      user.address, 
      BORROW_AMOUNT,
      CHAIN_SELECTOR
    ))
      .to.emit(mainRouter, "BorrowApproved")
      .withArgs(user.address, BORROW_AMOUNT, CHAIN_SELECTOR, creditScore);

    // Verify borrow was recorded
    expect(await mainRouter.userBorrows(user.address))
      .to.equal(BORROW_AMOUNT);

    // 4. Check health factor
    const healthFactor = await mainRouter.getHealthFactor(user.address);
    expect(healthFactor).to.be.gt(await mainRouter.MIN_HEALTH_FACTOR());
  });

  it("should reject borrow with insufficient collateral", async function () {
    const excessiveBorrow = DEPOSIT_AMOUNT.mul(2);
    await expect(mainRouter.connect(owner).approveBorrow(
      user.address,
      excessiveBorrow,
      CHAIN_SELECTOR
    )).to.be.revertedWithCustomError(mainRouter, "InsufficientCollateral");
  });
});