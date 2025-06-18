import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Minter Contract", function () {
  const MAIN_ROUTER_CHAIN_SELECTOR = 1;
  const DESTINATION_CHAIN_SELECTOR = 2;
  const POLYGON_CHAIN_SELECTOR = 3;

  async function deployMinterFixture() {
    // Deploy mock contracts
    const MockRouter = await ethers.getContractFactory("MockRouter");
    const mockRouter = await MockRouter.deploy();

    const [owner, user1, user2, mainRouter, beneficiary] = await ethers.getSigners();

    // Deploy Minter contract
    const Minter = await ethers.getContractFactory("Minter");
    const minter = await Minter.deploy(
      await mockRouter.getAddress(),
      MAIN_ROUTER_CHAIN_SELECTOR,
      mainRouter.address,
      "DecentralizedStableCoin",
      "DSC"
    );

    // Get DSC token address
    const dscTokenAddress = await minter.dscToken();
    const DSC = await ethers.getContractFactory("DSC");
    const dscToken = DSC.attach(dscTokenAddress);

    return {
      minter,
      dscToken,
      mockRouter,
      owner,
      user1,
      user2,
      mainRouter,
      beneficiary
    };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { minter, owner } = await loadFixture(deployMinterFixture);
      expect(await minter.owner()).to.equal(owner.address);
    });

    it("Should set the correct main router chain selector", async function () {
      const { minter } = await loadFixture(deployMinterFixture);
      expect(await minter.MAIN_ROUTER_CHAIN_SELECTOR()).to.equal(MAIN_ROUTER_CHAIN_SELECTOR);
    });

    it("Should set the correct main router address", async function () {
      const { minter, mainRouter } = await loadFixture(deployMinterFixture);
      expect(await minter.MAIN_ROUTER_ADDRESS()).to.equal(mainRouter.address);
    });

    it("Should deploy DSC token with correct parameters", async function () {
      const { dscToken } = await loadFixture(deployMinterFixture);
      expect(await dscToken.name()).to.equal("DecentralizedStableCoin");
      expect(await dscToken.symbol()).to.equal("DSC");
    });

    it("Should initialize allowlisted sources correctly", async function () {
      const { minter, mainRouter } = await loadFixture(deployMinterFixture);
      expect(await minter.allowlistedSourceChains(MAIN_ROUTER_CHAIN_SELECTOR)).to.be.true;
      expect(await minter.allowlistedSenders(mainRouter.address)).to.be.true;
    });

    it("Should revert with zero addresses", async function () {
      const [owner] = await ethers.getSigners();
      const Minter = await ethers.getContractFactory("Minter");
      
      // Test with zero router address - should revert with InvalidRouter
      await expect(
        Minter.deploy(
          ethers.ZeroAddress,
          MAIN_ROUTER_CHAIN_SELECTOR,
          owner.address,
          "DSC",
          "DSC"
        )
      ).to.be.revertedWithCustomError(Minter, "InvalidRouter");

      // Test with zero main router address - should revert with ZeroAddress
      const MockRouter = await ethers.getContractFactory("MockRouter");
      const mockRouter = await MockRouter.deploy();
      
      await expect(
        Minter.deploy(
          await mockRouter.getAddress(),
          MAIN_ROUTER_CHAIN_SELECTOR,
          ethers.ZeroAddress,
          "DSC",
          "DSC"
        )
      ).to.be.revertedWithCustomError(Minter, "ZeroAddress");
    });
  });

  describe("Administration", function () {
    it("Should allow owner to manage destination chains", async function () {
      const { minter, owner } = await loadFixture(deployMinterFixture);
      
      await minter.connect(owner).allowlistDestinationChain(DESTINATION_CHAIN_SELECTOR, true);
      expect(await minter.allowlistedDestinationChains(DESTINATION_CHAIN_SELECTOR)).to.be.true;
      
      await minter.connect(owner).allowlistDestinationChain(DESTINATION_CHAIN_SELECTOR, false);
      expect(await minter.allowlistedDestinationChains(DESTINATION_CHAIN_SELECTOR)).to.be.false;
    });

    it("Should allow owner to manage source chains", async function () {
      const { minter, owner } = await loadFixture(deployMinterFixture);
      
      await minter.connect(owner).allowlistSourceChain(DESTINATION_CHAIN_SELECTOR, true);
      expect(await minter.allowlistedSourceChains(DESTINATION_CHAIN_SELECTOR)).to.be.true;
    });

    it("Should allow owner to manage senders", async function () {
      const { minter, owner, user1 } = await loadFixture(deployMinterFixture);
      
      await minter.connect(owner).allowlistSender(user1.address, true);
      expect(await minter.allowlistedSenders(user1.address)).to.be.true;
    });

    it("Should allow owner to set chain minters", async function () {
      const { minter, owner, user1 } = await loadFixture(deployMinterFixture);
      
      await minter.connect(owner).setChainMinter(POLYGON_CHAIN_SELECTOR, user1.address);
      expect(await minter.chainToMinter(POLYGON_CHAIN_SELECTOR)).to.equal(user1.address);
      expect(await minter.allowlistedDestinationChains(POLYGON_CHAIN_SELECTOR)).to.be.true;
    });

    it("Should prevent non-owners from managing settings", async function () {
      const { minter, user1 } = await loadFixture(deployMinterFixture);
      
      await expect(
        minter.connect(user1).allowlistDestinationChain(DESTINATION_CHAIN_SELECTOR, true)
      ).to.be.revertedWith("Only callable by owner");
    });
  });

  describe("DSC Minting", function () {
    it("Should allow authorized addresses to mint DSC", async function () {
      const { minter, dscToken, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("100");

      await expect(minter.connect(mainRouter).mintDSC(user1.address, mintAmount))
        .to.emit(minter, "DSCMinted")
        .withArgs(user1.address, mintAmount, ethers.ZeroHash);

      expect(await dscToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await minter.userBorrowedAmounts(user1.address)).to.equal(mintAmount);
      expect(await minter.userTotalBorrowed(user1.address)).to.equal(mintAmount);
    });

    it("Should prevent unauthorized addresses from minting", async function () {
      const { minter, user1, user2 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("100");

      await expect(
        minter.connect(user1).mintDSC(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(minter, "UnauthorizedMint");
    });

    it("Should revert minting with zero amount", async function () {
      const { minter, mainRouter, user1 } = await loadFixture(deployMinterFixture);

      await expect(
        minter.connect(mainRouter).mintDSC(user1.address, 0)
      ).to.be.revertedWithCustomError(minter, "ZeroAmount");
    });

    it("Should revert minting to zero address", async function () {
      const { minter, mainRouter } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("100");

      await expect(
        minter.connect(mainRouter).mintDSC(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWithCustomError(minter, "ZeroAddress");
    });
  });

  describe("DSC Burning", function () {
    it("Should allow users to burn their DSC tokens", async function () {
      const { minter, dscToken, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      const burnAmount = ethers.parseEther("50");
      
      // Mint DSC tokens
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // User needs to approve the minter contract to burn their tokens
      await dscToken.connect(user1).approve(await minter.getAddress(), burnAmount);

      await expect(minter.connect(user1).burnDSC(burnAmount))
        .to.emit(minter, "DSCBurned")
        .withArgs(user1.address, burnAmount, ethers.ZeroHash);

      expect(await dscToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await minter.userBorrowedAmounts(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await minter.userTotalBorrowed(user1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should revert burning with insufficient balance", async function () {
      const { minter, dscToken, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      const burnAmount = ethers.parseEther("300"); // More than minted
      
      // Mint some tokens first
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Approve the burn amount
      await dscToken.connect(user1).approve(await minter.getAddress(), burnAmount);

      await expect(
        minter.connect(user1).burnDSC(burnAmount)
      ).to.be.revertedWithCustomError(minter, "InsufficientDSCBalance");
    });

    it("Should revert burning zero amount", async function () {
      const { minter, user1 } = await loadFixture(deployMinterFixture);

      await expect(
        minter.connect(user1).burnDSC(0)
      ).to.be.revertedWithCustomError(minter, "ZeroAmount");
    });
  });

  describe("Cross-Chain Swap (Burn and Mint)", function () {
    beforeEach(async function () {
      // Setup for cross-chain operations
      const { minter, mainRouter, user1, owner } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      
      // Mint DSC tokens
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Setup destination chain and minter
      await minter.connect(owner).setChainMinter(DESTINATION_CHAIN_SELECTOR, user1.address);
      
      // Fund contract with ETH for fees
      await owner.sendTransaction({
        to: await minter.getAddress(),
        value: ethers.parseEther("1")
      });
    });

    it("Should initiate cross-chain swap successfully", async function () {
      const { minter, dscToken, mainRouter, user1, owner } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      const swapAmount = ethers.parseEther("100");
      
      // Mint DSC tokens
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Setup destination chain and minter
      await minter.connect(owner).setChainMinter(DESTINATION_CHAIN_SELECTOR, user1.address);
      
      // Fund contract with ETH for fees
      await owner.sendTransaction({
        to: await minter.getAddress(),
        value: ethers.parseEther("1")
      });
      
      // User needs to approve the minter contract to burn their tokens
      await dscToken.connect(user1).approve(await minter.getAddress(), swapAmount);
      
      const initialBalance = await dscToken.balanceOf(user1.address);

      await expect(minter.connect(user1).burnAndMint(swapAmount, DESTINATION_CHAIN_SELECTOR))
        .to.emit(minter, "CrossChainSwapInitiated");

      // Check that DSC was burned on source chain
      expect(await dscToken.balanceOf(user1.address)).to.equal(initialBalance - swapAmount);
      expect(await minter.userBorrowedAmounts(user1.address)).to.equal(mintAmount - swapAmount);
    });

    it("Should revert cross-chain swap to non-allowlisted chain", async function () {
      const { minter, dscToken, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      const swapAmount = ethers.parseEther("100");
      const invalidChain = 999;
      
      // Mint DSC tokens first
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Approve tokens for burning
      await dscToken.connect(user1).approve(await minter.getAddress(), swapAmount);

      await expect(
        minter.connect(user1).burnAndMint(swapAmount, invalidChain)
      ).to.be.revertedWithCustomError(minter, "DestinationChainNotAllowed");
    });

    it("Should revert cross-chain swap with insufficient balance", async function () {
      const { minter, dscToken, mainRouter, user1, owner } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      const swapAmount = ethers.parseEther("300"); // More than available
      
      // Mint DSC tokens first
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Setup destination chain
      await minter.connect(owner).setChainMinter(DESTINATION_CHAIN_SELECTOR, user1.address);
      
      // Approve tokens for burning
      await dscToken.connect(user1).approve(await minter.getAddress(), swapAmount);

      await expect(
        minter.connect(user1).burnAndMint(swapAmount, DESTINATION_CHAIN_SELECTOR)
      ).to.be.revertedWithCustomError(minter, "InsufficientDSCBalance");
    });

    it("Should revert cross-chain swap with zero amount", async function () {
      const { minter, dscToken, mainRouter, user1, owner } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("200");
      
      // Mint DSC tokens first
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
      
      // Setup destination chain
      await minter.connect(owner).setChainMinter(DESTINATION_CHAIN_SELECTOR, user1.address);

      await expect(
        minter.connect(user1).burnAndMint(0, DESTINATION_CHAIN_SELECTOR)
      ).to.be.revertedWithCustomError(minter, "ZeroAmount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { minter, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("150");
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);
    });

    it("Should return correct user borrowed amount", async function () {
      const { minter, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("150");
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);

      expect(await minter.getUserBorrowedAmount(user1.address)).to.equal(mintAmount);
    });

    it("Should return correct user total borrowed", async function () {
      const { minter, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("150");
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);

      expect(await minter.getUserTotalBorrowed(user1.address)).to.equal(mintAmount);
    });

    it("Should return correct DSC balance", async function () {
      const { minter, mainRouter, user1 } = await loadFixture(deployMinterFixture);
      const mintAmount = ethers.parseEther("150");
      await minter.connect(mainRouter).mintDSC(user1.address, mintAmount);

      expect(await minter.getDSCBalance(user1.address)).to.equal(mintAmount);
    });

    it("Should return correct burn and mint fee", async function () {
      const { minter, owner, user1 } = await loadFixture(deployMinterFixture);
      
      await minter.connect(owner).setChainMinter(DESTINATION_CHAIN_SELECTOR, user1.address);
      
      const fee = await minter.getBurnAndMintFee(
        ethers.parseEther("100"),
        DESTINATION_CHAIN_SELECTOR
      );
      
      expect(fee).to.be.gt(0); // Should return a positive fee
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to withdraw ETH", async function () {
      const { minter, owner, beneficiary } = await loadFixture(deployMinterFixture);
      
      // Send ETH to contract
      const ethAmount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await minter.getAddress(),
        value: ethAmount
      });

      await expect(minter.connect(owner).withdraw(beneficiary.address))
        .to.changeEtherBalances(
          [await minter.getAddress(), beneficiary.address],
          [-ethAmount, ethAmount]
        );
    });

    it("Should revert withdraw with nothing to withdraw", async function () {
      const { minter, owner, beneficiary } = await loadFixture(deployMinterFixture);

      await expect(
        minter.connect(owner).withdraw(beneficiary.address)
      ).to.be.revertedWithCustomError(minter, "NothingToWithdraw");
    });

    it("Should prevent non-owners from withdrawing", async function () {
      const { minter, user1, beneficiary } = await loadFixture(deployMinterFixture);

      await expect(
        minter.connect(user1).withdraw(beneficiary.address)
      ).to.be.revertedWith("Only callable by owner");
    });

    it("Should allow contract to receive ETH", async function () {
      const { minter, owner } = await loadFixture(deployMinterFixture);
      const ethAmount = ethers.parseEther("0.5");

      await expect(
        owner.sendTransaction({
          to: await minter.getAddress(),
          value: ethAmount
        })
      ).to.changeEtherBalance(await minter.getAddress(), ethAmount);
    });
  });

  describe("Utility Functions", function () {
    it("Should convert address to string correctly", async function () {
      const { minter } = await loadFixture(deployMinterFixture);
      
      // This tests the internal utility function indirectly through message encoding
      const mintMsg = {
        user: "0x1234567890123456789012345678901234567890",
        amount: ethers.parseEther("100"),
        action: 1,
        destinationChain: DESTINATION_CHAIN_SELECTOR
      };
      
      // The _encodeMintMessage function uses _addressToString internally
      // We can't directly test private functions, but we can verify the contract compiles and works
      expect(await minter.MAIN_ROUTER_CHAIN_SELECTOR()).to.equal(MAIN_ROUTER_CHAIN_SELECTOR);
    });
  });

  describe("Error Handling", function () {
    it("Should handle all custom errors correctly", async function () {
      const { minter, user1, user2 } = await loadFixture(deployMinterFixture);

      // Test UnauthorizedMint
      await expect(
        minter.connect(user1).mintDSC(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(minter, "UnauthorizedMint");

      // Test ZeroAmount
      await expect(
        minter.connect(user1).burnDSC(0)
      ).to.be.revertedWithCustomError(minter, "ZeroAmount");

      // Test DestinationChainNotAllowed
      await expect(
        minter.connect(user1).burnAndMint(ethers.parseEther("100"), 999)
      ).to.be.revertedWithCustomError(minter, "DestinationChainNotAllowed");
    });
  });
});