import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Minter Contract", function () {
  let Minter, minter;
  let DSC, dsc;
  let owner, user1, user2;
  let mockRouter;

  // Constants
  const MAIN_ROUTER_CHAIN_SELECTOR = 1;
  const MAIN_ROUTER_ADDRESS = "0x0000000000000000000000000000000000000000";
  const DSC_NAME = "DeFi Stablecoin";
  const DSC_SYMBOL = "DSC";
  const OTHER_CHAIN_SELECTOR = 2;
  const OTHER_CHAIN_MINTER = "0x0000000000000000000000000000000000000000";
  const MINT_AMOUNT = ethers.parseUnits("1000", 18);
  const BURN_AMOUNT = ethers.parseUnits("500", 18);
  const SWAP_AMOUNT = ethers.parseUnits("1000", 18);
  const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy MockRouter first
    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouter = await MockRouter.deploy();
    await mockRouter.deployed();

    // Deploy Minter contract
    const Minter = await ethers.getContractFactory("Minter");
    minter = await Minter.deploy(
      mockRouter.address,
      MAIN_ROUTER_CHAIN_SELECTOR,
      MAIN_ROUTER_ADDRESS,
      DSC_NAME,
      DSC_SYMBOL,
      ZERO_BYTES32, // Use valid bytes32 for DON ID
      0 // subscription ID
    );
    await minter.deployed();

    // Get the deployed DSC token
    const dscAddress = await minter.dscToken();
    dsc = await ethers.getContractAt("DSC", dscAddress);

    // Setup other chain minter
    await minter.setChainMinter(OTHER_CHAIN_SELECTOR, OTHER_CHAIN_MINTER);

    // Fund the contract with ETH for CCIP fees
    await owner.sendTransaction({
      to: minter.address,
      value: ethers.parseEther("1")
    });
  });

  describe("Deployment", function () {
    it("Should set up contract correctly", async function () {
      expect(await dsc.name()).to.equal(DSC_NAME);
      expect(await dsc.symbol()).to.equal(DSC_SYMBOL);
      expect(await minter.owner()).to.equal(owner.address);
      expect(await minter.MAIN_ROUTER_ADDRESS()).to.equal(MAIN_ROUTER_ADDRESS);
    });
  });

  describe("DSC Minting", function () {
    beforeEach(async function () {
      await minter.allowlistSender(owner.address, true);
    });

    it("Should mint tokens when called by authorized sender", async function () {
      await expect(minter.connect(owner).mintDSC(user1.address, MINT_AMOUNT))
        .to.emit(minter, "DSCMinted")
        .withArgs(user1.address, MINT_AMOUNT, ethers.constants.HashZero);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(MINT_AMOUNT);
    });

    it("Should update borrow tracking", async function () {
      await minter.connect(owner).mintDSC(user1.address, MINT_AMOUNT);
      expect(await minter.userBorrowedAmounts(user1.address)).to.equal(MINT_AMOUNT);
    });

    it("Should reject unauthorized mint attempts", async function () {
      await expect(minter.connect(user1).mintDSC(user1.address, MINT_AMOUNT))
        .to.be.revertedWithCustomError(minter, "UnauthorizedMint");
    });
  });

  describe("DSC Burning", function () {
    beforeEach(async function () {
      await minter.allowlistSender(owner.address, true);
      await minter.connect(owner).mintDSC(user1.address, BURN_AMOUNT.mul(2));
    });

    it("Should burn tokens when called by token holder", async function () {
      await expect(minter.connect(user1).burnDSC(BURN_AMOUNT))
        .to.emit(minter, "DSCBurned")
        .withArgs(user1.address, BURN_AMOUNT, ethers.constants.HashZero);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(BURN_AMOUNT);
    });

    it("Should update borrow tracking", async function () {
      await minter.connect(user1).burnDSC(BURN_AMOUNT);
      expect(await minter.userBorrowedAmounts(user1.address)).to.equal(BURN_AMOUNT);
    });

    it("Should reject excessive burn attempts", async function () {
      await expect(minter.connect(user1).burnDSC(BURN_AMOUNT.mul(3)))
        .to.be.revertedWithCustomError(minter, "InsufficientDSCBalance");
    });
  });

  describe("Cross-chain Operations", function () {
    beforeEach(async function () {
      await minter.allowlistSender(owner.address, true);
      await minter.connect(owner).mintDSC(user1.address, SWAP_AMOUNT.mul(2));
    });

    it("Should initiate burn-and-mint swap", async function () {
      await expect(minter.connect(user1).burnAndMint(SWAP_AMOUNT, OTHER_CHAIN_SELECTOR))
        .to.emit(minter, "CrossChainSwapInitiated");
      
      expect(await dsc.balanceOf(user1.address)).to.equal(SWAP_AMOUNT);
    });

    it("Should complete swap when receiving message", async function () {
      const message = {
        user: user1.address,
        amount: SWAP_AMOUNT,
        action: 3,
        destinationChain: OTHER_CHAIN_SELECTOR
      };
      const encodedMessage = await minter.callStatic._encodeMintMessage(message);
      
      await mockRouter.simulateCCIPReceive(
        minter.address,
        OTHER_CHAIN_SELECTOR,
        OTHER_CHAIN_MINTER,
        ethers.utils.defaultAbiCoder.encode(["string"], [encodedMessage])
      );
      
      expect(await dsc.balanceOf(user1.address)).to.equal(SWAP_AMOUNT);
    });

    it("Should reject invalid chain swaps", async function () {
      await expect(minter.connect(user1).burnAndMint(SWAP_AMOUNT, 999))
        .to.be.revertedWithCustomError(minter, "DestinationChainNotAllowed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to manage allowlists", async function () {
      await minter.allowlistDestinationChain(OTHER_CHAIN_SELECTOR, false);
      expect(await minter.allowlistedDestinationChains(OTHER_CHAIN_SELECTOR)).to.be.false;
    });

    it("Should prevent non-owners from admin functions", async function () {
      await expect(minter.connect(user1).allowlistDestinationChain(OTHER_CHAIN_SELECTOR, true))
        .to.be.revertedWith("Only callable by owner");
    });

    it("Should allow owner to withdraw funds", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await minter.withdraw(owner.address);
      expect(await ethers.provider.getBalance(owner.address)).to.be.gt(balanceBefore);
    });
  });
});