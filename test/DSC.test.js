const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DSC (DeFi Stablecoin) Contract", function () {
  let DSC, dsc;
  let owner, minter, user1, user2;

  const NAME = "DeFi Stablecoin";
  const SYMBOL = "DSC";
  const MAX_SUPPLY = ethers.utils.parseUnits("1000000000", 18); // 1 billion DSC

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();
    
    DSC = await ethers.getContractFactory("DSC");
    dsc = await DSC.deploy(NAME, SYMBOL, minter.address);
    await dsc.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await dsc.name()).to.equal(NAME);
      expect(await dsc.symbol()).to.equal(SYMBOL);
    });

    it("Should set the correct decimals", async function () {
      expect(await dsc.decimals()).to.equal(18);
    });

    it("Should set the correct max supply", async function () {
      expect(await dsc.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should set the initial minter correctly", async function () {
      expect(await dsc.isMinter(minter.address)).to.be.true;
    });

    it("Should set the deployer as owner", async function () {
      expect(await dsc.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);

    it("Should allow authorized minter to mint tokens", async function () {
      await expect(dsc.connect(minter).mint(user1.address, mintAmount))
        .to.emit(dsc, "TokensMinted")
        .withArgs(user1.address, mintAmount, minter.address);

      expect(await dsc.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      await expect(dsc.connect(user1).mint(user2.address, mintAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__NotMinter");
    });

    it("Should not allow minting to zero address", async function () {
      await expect(dsc.connect(minter).mint(ethers.constants.AddressZero, mintAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("Should not allow minting zero amount", async function () {
      await expect(dsc.connect(minter).mint(user1.address, 0))
        .to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
    });

    it("Should not allow minting beyond max supply", async function () {
      const almostMaxAmount = MAX_SUPPLY.sub(ethers.utils.parseUnits("1", 18));
      
      // Mint almost all supply
      await dsc.connect(minter).mint(user1.address, almostMaxAmount);
      
      // Try to mint 2 more tokens (which would exceed max supply)
      await expect(dsc.connect(minter).mint(user1.address, ethers.utils.parseUnits("2", 18)))
        .to.be.revertedWith("DSC: Exceeds max supply");
    });

    it("Should correctly report remaining mintable supply", async function () {
      const mintAmount1 = ethers.utils.parseUnits("500000000", 18); // 500 million
      const mintAmount2 = ethers.utils.parseUnits("300000000", 18); // 300 million
      
      await dsc.connect(minter).mint(user1.address, mintAmount1);
      expect(await dsc.remainingMintableSupply()).to.equal(MAX_SUPPLY.sub(mintAmount1));
      
      await dsc.connect(minter).mint(user2.address, mintAmount2);
      expect(await dsc.remainingMintableSupply()).to.equal(MAX_SUPPLY.sub(mintAmount1.add(mintAmount2)));
    });

    it("Should correctly report if minting would exceed max supply", async function () {
      const mintAmount1 = MAX_SUPPLY.sub(ethers.utils.parseUnits("100", 18));
      const testAmount = ethers.utils.parseUnits("101", 18);
      
      await dsc.connect(minter).mint(user1.address, mintAmount1);
      
      expect(await dsc.wouldExceedMaxSupply(testAmount)).to.be.true;
      expect(await dsc.wouldExceedMaxSupply(ethers.utils.parseUnits("99", 18))).to.be.false;
    });
  });

  describe("Burning", function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    const burnAmount = ethers.utils.parseUnits("500", 18);

    beforeEach(async function () {
      await dsc.connect(minter).mint(user1.address, mintAmount);
    });

    it("Should allow users to burn their own tokens", async function () {
      await expect(dsc.connect(user1).burn(burnAmount))
        .to.emit(dsc, "TokensBurned")
        .withArgs(user1.address, burnAmount, user1.address);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(mintAmount.sub(burnAmount));
    });

    it("Should allow minters to burn tokens from other addresses", async function () {
      await expect(dsc.connect(minter).burnFrom(user1.address, burnAmount))
        .to.emit(dsc, "TokensBurned")
        .withArgs(user1.address, burnAmount, minter.address);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(mintAmount.sub(burnAmount));
    });

    it("Should not allow burning more than balance", async function () {
      const excessiveAmount = mintAmount.add(1);
      
      await expect(dsc.connect(user1).burn(excessiveAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__BurnAmountExceedsBalance");
      
      await expect(dsc.connect(minter).burnFrom(user1.address, excessiveAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__BurnAmountExceedsBalance");
    });

    it("Should not allow burning from zero address", async function () {
      await expect(dsc.connect(minter).burnFrom(ethers.constants.AddressZero, burnAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("Should not allow burning zero amount", async function () {
      await expect(dsc.connect(user1).burn(0))
        .to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
      
      await expect(dsc.connect(minter).burnFrom(user1.address, 0))
        .to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to add new minters", async function () {
      await expect(dsc.connect(owner).addMinter(user1.address))
        .to.emit(dsc, "MinterAdded")
        .withArgs(user1.address);
      
      expect(await dsc.isMinter(user1.address)).to.be.true;
    });

    it("Should allow owner to remove minters", async function () {
      await dsc.connect(owner).addMinter(user1.address);
      
      await expect(dsc.connect(owner).removeMinter(user1.address))
        .to.emit(dsc, "MinterRemoved")
        .withArgs(user1.address);
      
      expect(await dsc.isMinter(user1.address)).to.be.false;
    });

    it("Should not allow non-owner to add minters", async function () {
      await expect(dsc.connect(user1).addMinter(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow non-owner to remove minters", async function () {
      await expect(dsc.connect(user1).removeMinter(minter.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow adding zero address as minter", async function () {
      await expect(dsc.connect(owner).addMinter(ethers.constants.AddressZero))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("Should not allow removing zero address as minter", async function () {
      await expect(dsc.connect(owner).removeMinter(ethers.constants.AddressZero))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("Should not allow adding existing minter again", async function () {
      await expect(dsc.connect(owner).addMinter(minter.address))
        .to.be.revertedWith("DSC: Address is already a minter");
    });

    it("Should not allow removing non-minter", async function () {
      await expect(dsc.connect(owner).removeMinter(user1.address))
        .to.be.revertedWith("DSC: Address is not a minter");
    });

    it("Should correctly track minters list", async function () {
      // Initial minter is already there
      expect(await dsc.getMintersCount()).to.equal(1);
      
      // Add two more minters
      await dsc.connect(owner).addMinter(user1.address);
      await dsc.connect(owner).addMinter(user2.address);
      
      expect(await dsc.getMintersCount()).to.equal(3);
      
      const minters = await dsc.getMinters();
      expect(minters).to.include(minter.address);
      expect(minters).to.include(user1.address);
      expect(minters).to.include(user2.address);
      
      // Remove one minter
      await dsc.connect(owner).removeMinter(user1.address);
      expect(await dsc.getMintersCount()).to.equal(2);
      
      const updatedMinters = await dsc.getMinters();
      expect(updatedMinters).to.not.include(user1.address);
    });
  });

  describe("Transfers", function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    const transferAmount = ethers.utils.parseUnits("500", 18);

    beforeEach(async function () {
      await dsc.connect(minter).mint(user1.address, mintAmount);
    });

    it("Should allow standard token transfers", async function () {
      await expect(dsc.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(dsc, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(mintAmount.sub(transferAmount));
      expect(await dsc.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should allow approved transfers via transferFrom", async function () {
      await dsc.connect(user1).approve(user2.address, transferAmount);
      
      await expect(dsc.connect(user2).transferFrom(user1.address, user2.address, transferAmount))
        .to.emit(dsc, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
      
      expect(await dsc.balanceOf(user1.address)).to.equal(mintAmount.sub(transferAmount));
      expect(await dsc.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should not allow transfers to zero address", async function () {
      await expect(dsc.connect(user1).transfer(ethers.constants.AddressZero, transferAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
      
      await dsc.connect(user1).approve(user2.address, transferAmount);
      
      await expect(dsc.connect(user2).transferFrom(user1.address, ethers.constants.AddressZero, transferAmount))
        .to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });
  });
});