// SPDX-License-Identifier: MIT
import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("DeFiPassportNFT", function () {
  // Fixture to deploy the contract and set up initial state
  async function deployDeFiPassportNFTFixture() {
    const [owner, user1, user2, mainRouter, unauthorized] = await ethers.getSigners();

    const DeFiPassportNFT = await ethers.getContractFactory("DeFiPassportNFT");
    const deFiPassportNFT = await DeFiPassportNFT.deploy(
      "DeFi Passport",
      "DFP",
      mainRouter.address
    );
    await deFiPassportNFT.waitForDeployment();

    return { deFiPassportNFT, owner, user1, user2, mainRouter, unauthorized };
  }

  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      const { deFiPassportNFT } = await loadFixture(deployDeFiPassportNFTFixture);
      expect(await deFiPassportNFT.name()).to.equal("DeFi Passport");
      expect(await deFiPassportNFT.symbol()).to.equal("DFP");
    });

    it("should set the main router as an authorized updater", async function () {
      const { deFiPassportNFT, mainRouter } = await loadFixture(deployDeFiPassportNFTFixture);
      expect(await deFiPassportNFT.authorizedUpdaters(mainRouter.address)).to.be.true;
    });

    it("should set the deployer as the owner", async function () {
      const { deFiPassportNFT, owner } = await loadFixture(deployDeFiPassportNFTFixture);
      expect(await deFiPassportNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("should allow authorized updater to mint a passport", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);

      await expect(
        deFiPassportNFT.connect(mainRouter).mintPassport(
          user1.address,
          600, // creditScore
          100, // totalTransactions
          10000, // totalVolumeUSD
          5 // protocolsUsed
        )
      )
        .to.emit(deFiPassportNFT, "PassportMinted")
        .withArgs(user1.address, 1, 600);

      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      expect(tokenId).to.equal(1);
      expect(await deFiPassportNFT.tokenExists(tokenId)).to.be.true;

      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(600);
      expect(passportData.totalTransactions).to.equal(100);
      expect(passportData.totalVolumeUSD).to.equal(10000);
      expect(passportData.protocolsUsed).to.equal(5);
      expect(passportData.level).to.equal(1); // SILVER
      expect(passportData.isActive).to.be.true;
    });

    it("should revert if minting for zero address", async function () {
      const { deFiPassportNFT, mainRouter } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(mainRouter).mintPassport(
          ethers.ZeroAddress,
          600,
          100,
          10000,
          5
        )
      ).to.be.revertedWithCustomError(deFiPassportNFT, "ZeroAddress");
    });

    it("should revert if passport already exists", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      await expect(
        deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "PassportAlreadyExists");
    });

    it("should revert if credit score is invalid", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 1001, 100, 10000, 5)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "InvalidCreditScore");
    });

    it("should revert if called by unauthorized updater", async function () {
      const { deFiPassportNFT, unauthorized, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(unauthorized).mintPassport(user1.address, 600, 100, 10000, 5)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "NotAuthorizedUpdater");
    });
  });

  describe("Updating Passport", function () {
    it("should allow authorized updater to update passport data", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);

      await expect(
        deFiPassportNFT.connect(mainRouter).updatePassport(
          user1.address,
          800, // newCreditScore
          150, // totalTransactions
          20000, // totalVolumeUSD
          10, // protocolsUsed
          1, // liquidationCount
          50 // governanceParticipation
        )
      )
        .to.emit(deFiPassportNFT, "PassportUpdated")
        .withArgs(user1.address, 1, 800)
        .to.emit(deFiPassportNFT, "CreditScoreUpdated")
        .withArgs(1, 600, 800);

      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(800);
      expect(passportData.totalTransactions).to.equal(150);
      expect(passportData.totalVolumeUSD).to.equal(20000);
      expect(passportData.protocolsUsed).to.equal(10);
      expect(passportData.liquidationCount).to.equal(1);
      expect(passportData.governanceParticipation).to.equal(50);
      expect(passportData.level).to.equal(2); // GOLD
    });

    it("should allow authorized updater to update only credit score", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);

      await expect(
        deFiPassportNFT.connect(mainRouter).updateCreditScore(user1.address, 900)
      )
        .to.emit(deFiPassportNFT, "CreditScoreUpdated")
        .withArgs(1, 600, 900);

      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(900);
      expect(passportData.level).to.equal(3); // PLATINUM
    });

    it("should revert if updating non-existent passport", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(mainRouter).updatePassport(user1.address, 800, 150, 20000, 10, 1, 50)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "PassportDoesNotExist");
    });

    it("should revert if updating with invalid credit score", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      await expect(
        deFiPassportNFT.connect(mainRouter).updateCreditScore(user1.address, 1001)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "InvalidCreditScore");
    });
  });

  describe("Authorization", function () {
    it("should allow owner to authorize a new updater", async function () {
      const { deFiPassportNFT, owner, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(deFiPassportNFT.connect(owner).authorizeUpdater(user1.address))
        .to.emit(deFiPassportNFT, "UpdaterAuthorized")
        .withArgs(user1.address);
      expect(await deFiPassportNFT.authorizedUpdaters(user1.address)).to.be.true;
    });

    it("should allow owner to revoke an updater", async function () {
      const { deFiPassportNFT, owner, mainRouter } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(deFiPassportNFT.connect(owner).revokeUpdater(mainRouter.address))
        .to.emit(deFiPassportNFT, "UpdaterRevoked")
        .withArgs(mainRouter.address);
      expect(await deFiPassportNFT.authorizedUpdaters(mainRouter.address)).to.be.false;
    });

    it("should revert if authorizing zero address", async function () {
      const { deFiPassportNFT, owner } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(owner).authorizeUpdater(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "ZeroAddress");
    });

    it("should revert if non-owner tries to authorize updater", async function () {
      const { deFiPassportNFT, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await expect(
        deFiPassportNFT.connect(user1).authorizeUpdater(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer Restrictions", function () {
    it("should prevent token transfers", async function () {
      const { deFiPassportNFT, mainRouter, user1, user2 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      await expect(
        deFiPassportNFT.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("DeFi Passports are non-transferable");
    });
  });

  describe("View Functions", function () {
    it("should return correct passport data", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(600);
      expect(passportData.level).to.equal(1); // SILVER
    });

    it("should return correct total supply", async function () {
      const { deFiPassportNFT, mainRouter, user1, user2 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user2.address, 700, 200, 20000, 10);
      expect(await deFiPassportNFT.getTotalSupply()).to.equal(2);
    });

    it("should return correct token URI", async function () {
      const { deFiPassportNFT, mainRouter, user1 } = await loadFixture(deployDeFiPassportNFTFixture);
      await deFiPassportNFT.connect(mainRouter).mintPassport(user1.address, 600, 100, 10000, 5);
      const tokenURI = await deFiPassportNFT.tokenURI(1);
      expect(tokenURI).to.include("data:application/json;base64,");
    });
  });
});