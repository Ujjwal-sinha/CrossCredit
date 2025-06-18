// SPDX-License-Identifier: MIT
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("DSC", function () {
  // Fixture to deploy the contract and set up initial state
  async function deployDSCFixture() {
    const signers = await ethers.getSigners();
    if (signers.length < 4) {
      throw new Error("Insufficient signers available");
    }
    const [owner, minter, user, unauthorized] = signers;

    // Validate signers
    [owner, minter, user, unauthorized].forEach((signer, index) => {
      if (!signer || !signer.address) {
        throw new Error(`Signer at index ${index} is null or invalid`);
      }
    });

    // Deploy the DSC contract
    const DSC = await ethers.getContractFactory("DSC");
    const dsc = await DSC.deploy("DeFi Stablecoin", "DSC", minter.address);
    await dsc.waitForDeployment();
    if (!dsc.target) {
      throw new Error("DSC deployment failed: contract address is null");
    }

    return {
      dsc,
      owner,
      minter,
      user,
      unauthorized,
    };
  }

  describe("Deployment", function () {
    it("should set the correct name, symbol, and decimals", async function () {
      const { dsc } = await loadFixture(deployDSCFixture);
      expect(await dsc.name()).to.equal("DeFi Stablecoin");
      expect(await dsc.symbol()).to.equal("DSC");
      expect(await dsc.decimals()).to.equal(18);
    });

    it("should set the owner as the deployer", async function () {
      const { dsc, owner } = await loadFixture(deployDSCFixture);
      expect(await dsc.owner()).to.equal(owner.address);
    });

    it("should set the initial minter", async function () {
      const { dsc, minter } = await loadFixture(deployDSCFixture);
      expect(await dsc.isMinter(minter.address)).to.be.true;
      const minters = await dsc.getMinters();
      expect(minters).to.include(minter.address);
      expect(await dsc.getMintersCount()).to.equal(1);
    });

    it("should deploy with zero total supply", async function () {
      const { dsc } = await loadFixture(deployDSCFixture);
      expect(await dsc.totalSupply()).to.equal(0);
      expect(await dsc.remainingMintableSupply()).to.equal(ethers.parseEther("1000000000")); // 1 billion
    });

    it("should deploy with zero address as initial minter if provided", async function () {
      const DSC = await ethers.getContractFactory("DSC");
      const dsc = await DSC.deploy("DeFi Stablecoin", "DSC", ethers.ZeroAddress);
      await dsc.waitForDeployment();
      expect(await dsc.getMintersCount()).to.equal(0);
      const minters = await dsc.getMinters();
      expect(minters).to.be.empty;
    });
  });

  describe("Minter Management", function () {
    it("should allow owner to add a new minter", async function () {
      const { dsc, owner, user } = await loadFixture(deployDSCFixture);
      await expect(dsc.connect(owner).addMinter(user.address))
        .to.emit(dsc, "MinterAdded")
        .withArgs(user.address);
      expect(await dsc.isMinter(user.address)).to.be.true;
      const minters = await dsc.getMinters();
      expect(minters).to.include(user.address);
      expect(await dsc.getMintersCount()).to.equal(2);
    });

    it("should allow owner to remove a minter", async function () {
      const { dsc, owner, minter } = await loadFixture(deployDSCFixture);
      await expect(dsc.connect(owner).removeMinter(minter.address))
        .to.emit(dsc, "MinterRemoved")
        .withArgs(minter.address);
      expect(await dsc.isMinter(minter.address)).to.be.false;
      const minters = await dsc.getMinters();
      expect(minters).to.not.include(minter.address);
      expect(await dsc.getMintersCount()).to.equal(0);
    });

    it("should revert if non-owner tries to add a minter", async function () {
      const { dsc, unauthorized, user } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(unauthorized).addMinter(user.address)
      ).to.be.reverted;
    });

    it("should revert if non-owner tries to remove a minter", async function () {
      const { dsc, unauthorized, minter } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(unauthorized).removeMinter(minter.address)
      ).to.be.reverted;
    });

    it("should revert if adding zero address as minter", async function () {
      const { dsc, owner } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(owner).addMinter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("should revert if removing zero address as minter", async function () {
      const { dsc, owner } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(owner).removeMinter(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("should revert if adding an existing minter", async function () {
      const { dsc, owner, minter } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(owner).addMinter(minter.address)
      ).to.be.revertedWith("DSC: Address is already a minter");
    });

    it("should revert if removing a non-minter", async function () {
      const { dsc, owner, user } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(owner).removeMinter(user.address)
      ).to.be.revertedWith("DSC: Address is not a minter");
    });
  });

  describe("Minting", function () {
    it("should allow minter to mint tokens", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await expect(dsc.connect(minter).mint(user.address, amount))
        .to.emit(dsc, "TokensMinted")
        .withArgs(user.address, amount, minter.address);
      expect(await dsc.balanceOf(user.address)).to.equal(amount);
      expect(await dsc.totalSupply()).to.equal(amount);
      expect(await dsc.remainingMintableSupply()).to.equal(
        ethers.parseEther("1000000000") - amount
      );
    });

    it("should revert if non-minter tries to mint", async function () {
      const { dsc, unauthorized, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await expect(
        dsc.connect(unauthorized).mint(user.address, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotMinter");
    });

    it("should revert if minting to zero address", async function () {
      const { dsc, minter } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await expect(
        dsc.connect(minter).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("should revert if minting zero amount", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      await expect(
        dsc.connect(minter).mint(user.address, 0)
      ).to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
    });

    it("should revert if minting exceeds max supply", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000000001"); // 1 billion + 1
      await expect(
        dsc.connect(minter).mint(user.address, amount)
      ).to.be.revertedWith("DSC: Exceeds max supply");
    });

    it("should correctly check if minting would exceed max supply", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      expect(await dsc.wouldExceedMaxSupply(ethers.parseEther("999999000"))).to.be.false;
      expect(await dsc.wouldExceedMaxSupply(ethers.parseEther("1000000000"))).to.be.true;
    });
  });

  describe("Burning", function () {
    it("should allow minter to burn tokens from another address", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await dsc.connect(user).approve(minter.address, amount);
      await expect(dsc.connect(minter).burnFrom(user.address, amount))
        .to.emit(dsc, "TokensBurned")
        .withArgs(user.address, amount, minter.address);
      expect(await dsc.balanceOf(user.address)).to.equal(0);
      expect(await dsc.totalSupply()).to.equal(0);
      expect(await dsc.remainingMintableSupply()).to.equal(ethers.parseEther("1000000000"));
    });

    it("should allow user to burn their own tokens", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await expect(dsc.connect(user).burn(amount))
        .to.emit(dsc, "TokensBurned")
        .withArgs(user.address, amount, user.address);
      expect(await dsc.balanceOf(user.address)).to.equal(0);
      expect(await dsc.totalSupply()).to.equal(0);
    });

    it("should revert if non-minter tries to burn from another address", async function () {
      const { dsc, minter, user, unauthorized } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await dsc.connect(user).approve(unauthorized.address, amount);
      await expect(
        dsc.connect(unauthorized).burnFrom(user.address, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotMinter");
    });

    it("should revert if burning from zero address", async function () {
      const { dsc, minter } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await expect(
        dsc.connect(minter).burnFrom(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("should revert if burning zero amount", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      await dsc.connect(minter).mint(user.address, ethers.parseEther("1000"));
      await dsc.connect(user).approve(minter.address, ethers.parseEther("1000"));
      await expect(
        dsc.connect(minter).burnFrom(user.address, 0)
      ).to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
      await expect(
        dsc.connect(user).burn(0)
      ).to.be.revertedWithCustomError(dsc, "DSC__MustBeMoreThanZero");
    });

    it("should revert if burning more than balance", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await dsc.connect(user).approve(minter.address, amount * 2n);
      await expect(
        dsc.connect(minter).burnFrom(user.address, amount * 2n)
      ).to.be.revertedWithCustomError(dsc, "DSC__BurnAmountExceedsBalance");
      await expect(
        dsc.connect(user).burn(amount * 2n)
      ).to.be.revertedWithCustomError(dsc, "DSC__BurnAmountExceedsBalance");
    });

    it("should revert if burning without allowance", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await expect(
        dsc.connect(minter).burnFrom(user.address, amount)
      ).to.be.reverted;
    });
  });

  describe("Transfers", function () {
    it("should allow transfer of tokens", async function () {
      const { dsc, minter, user, unauthorized } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await expect(dsc.connect(user).transfer(unauthorized.address, amount))
        .to.emit(dsc, "Transfer")
        .withArgs(user.address, unauthorized.address, amount);
      expect(await dsc.balanceOf(user.address)).to.equal(0);
      expect(await dsc.balanceOf(unauthorized.address)).to.equal(amount);
    });

    it("should allow transferFrom of tokens", async function () {
      const { dsc, minter, user, unauthorized } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await dsc.connect(user).approve(unauthorized.address, amount);
      await expect(
        dsc.connect(unauthorized).transferFrom(user.address, unauthorized.address, amount)
      )
        .to.emit(dsc, "Transfer")
        .withArgs(user.address, unauthorized.address, amount);
      expect(await dsc.balanceOf(user.address)).to.equal(0);
      expect(await dsc.balanceOf(unauthorized.address)).to.equal(amount);
    });

    it("should revert if transferring to zero address", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await expect(
        dsc.connect(user).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
      await dsc.connect(user).approve(minter.address, amount);
      await expect(
        dsc.connect(minter).transferFrom(user.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(dsc, "DSC__NotZeroAddress");
    });

    it("should revert if transferring more than balance", async function () {
      const { dsc, minter, user, unauthorized } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000");
      await dsc.connect(minter).mint(user.address, amount);
      await expect(
        dsc.connect(user).transfer(unauthorized.address, amount * 2n)
      ).to.be.reverted;
      await dsc.connect(user).approve(minter.address, amount * 2n);
      await expect(
        dsc.connect(minter).transferFrom(user.address, unauthorized.address, amount * 2n)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("should return correct minters list", async function () {
      const { dsc, owner, minter, user } = await loadFixture(deployDSCFixture);
      await dsc.connect(owner).addMinter(user.address);
      const minters = await dsc.getMinters();
      expect(minters).to.include(minter.address);
      expect(minters).to.include(user.address);
      expect(await dsc.getMintersCount()).to.equal(2);
    });

    it("should return correct minter status", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      expect(await dsc.isMinter(minter.address)).to.be.true;
      expect(await dsc.isMinter(user.address)).to.be.false;
    });

    it("should return correct remaining mintable supply", async function () {
      const { dsc, minter, user } = await loadFixture(deployDSCFixture);
      const amount = ethers.parseEther("1000000");
      await dsc.connect(minter).mint(user.address, amount);
      expect(await dsc.remainingMintableSupply()).to.equal(
        ethers.parseEther("1000000000") - amount
      );
    });
  });
});