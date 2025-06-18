import { expect } from "chai";
import { ethers } from "hardhat";

describe("DeFiPassportNFT", function () {
  let DeFiPassportNFT, deFiPassportNFT;
  let owner, user1, user2, mainRouter, unauthorized;
  const NAME = "DeFi Passport NFT";
  const SYMBOL = "DFP";
  const INITIAL_CREDIT_SCORE = 600;
  const TOTAL_TRANSACTIONS = 100;
  const TOTAL_VOLUME_USD = 1000000;
  const PROTOCOLS_USED = 5;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, mainRouter, unauthorized] = await ethers.getSigners();

    // Deploy the contract
    DeFiPassportNFT = await ethers.getContractFactory("DeFiPassportNFT");
    deFiPassportNFT = await DeFiPassportNFT.deploy(NAME, SYMBOL, mainRouter.address);
    await deFiPassportNFT.waitForDeployment();
  });

  it("should deploy successfully with correct parameters", async function () {
    expect(deFiPassportNFT.target).to.be.properAddress;
    expect(await deFiPassportNFT.name()).to.equal(NAME);
    expect(await deFiPassportNFT.symbol()).to.equal(SYMBOL);
    expect(await deFiPassportNFT.authorizedUpdaters(mainRouter.address)).to.be.true;
  });

  describe("Minting", function () {
    it("should mint a passport NFT successfully", async function () {
      // Mint passport as authorized updater (mainRouter)
      const tx = await deFiPassportNFT
        .connect(mainRouter)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );
      const receipt = await tx.wait();

      // Check token ownership and data
      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      expect(tokenId).to.equal(1);
      expect(await deFiPassportNFT.ownerOf(tokenId)).to.equal(user1.address);
      expect(await deFiPassportNFT.tokenExists(tokenId)).to.be.true;

      // Check passport data
      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(INITIAL_CREDIT_SCORE);
      expect(passportData.totalTransactions).to.equal(TOTAL_TRANSACTIONS);
      expect(passportData.totalVolumeUSD).to.equal(TOTAL_VOLUME_USD);
      expect(passportData.protocolsUsed).to.equal(PROTOCOLS_USED);
      expect(passportData.liquidationCount).to.equal(0);
      expect(passportData.governanceParticipation).to.equal(0);
      expect(passportData.isActive).to.be.true;
      expect(passportData.level).to.equal(1); // SILVER (500-699)

      // Check event
      await expect(tx)
        .to.emit(deFiPassportNFT, "PassportMinted")
        .withArgs(user1.address, tokenId, INITIAL_CREDIT_SCORE);

      // Check token URI
      const tokenURI = await deFiPassportNFT.tokenURI(tokenId);
      expect(tokenURI).to.contain("data:application/json;base64,");
    });

    it("should revert if minting for zero address", async function () {
      await expect(
        deFiPassportNFT
          .connect(mainRouter)
          .mintPassport(
            ethers.ZeroAddress,
            INITIAL_CREDIT_SCORE,
            TOTAL_TRANSACTIONS,
            TOTAL_VOLUME_USD,
            PROTOCOLS_USED
          )
      ).to.be.revertedWithCustomError(deFiPassportNFT, "ZeroAddress");
    });

    it("should revert if passport already exists", async function () {
      await deFiPassportNFT
        .connect(mainRouter)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );

      await expect(
        deFiPassportNFT
          .connect(mainRouter)
          .mintPassport(
            user1.address,
            INITIAL_CREDIT_SCORE,
            TOTAL_TRANSACTIONS,
            TOTAL_VOLUME_USD,
            PROTOCOLS_USED
          )
      ).to.be.revertedWithCustomError(deFiPassportNFT, "PassportAlreadyExists");
    });

    it("should revert if credit score is invalid", async function () {
      await expect(
        deFiPassportNFT
          .connect(mainRouter)
          .mintPassport(user1.address, 1001, TOTAL_TRANSACTIONS, TOTAL_VOLUME_USD, PROTOCOLS_USED)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "InvalidCreditScore");
    });

    it("should revert if called by unauthorized updater", async function () {
      await expect(
        deFiPassportNFT
          .connect(unauthorized)
          .mintPassport(
            user1.address,
            INITIAL_CREDIT_SCORE,
            TOTAL_TRANSACTIONS,
            TOTAL_VOLUME_USD,
            PROTOCOLS_USED
          )
      ).to.be.revertedWithCustomError(deFiPassportNFT, "NotAuthorizedUpdater");
    });
  });

  describe("Updating Passport", function () {
    beforeEach(async function () {
      // Mint a passport for user1
      await deFiPassportNFT
        .connect(mainRouter)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );
    });

    it("should update passport data successfully", async function () {
      const newCreditScore = 750;
      const newTransactions = 200;
      const newVolumeUSD = 2000000;
      const newProtocolsUsed = 10;
      const liquidationCount = 1;
      const governanceParticipation = 50;

      const tx = await deFiPassportNFT
        .connect(mainRouter)
        .updatePassport(
          user1.address,
          newCreditScore,
          newTransactions,
          newVolumeUSD,
          newProtocolsUsed,
          liquidationCount,
          governanceParticipation
        );

      // Check updated data
      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(newCreditScore);
      expect(passportData.totalTransactions).to.equal(newTransactions);
      expect(passportData.totalVolumeUSD).to.equal(newVolumeUSD);
      expect(passportData.protocolsUsed).to.equal(newProtocolsUsed);
      expect(passportData.liquidationCount).to.equal(liquidationCount);
      expect(passportData.governanceParticipation).to.equal(governanceParticipation);
      expect(passportData.level).to.equal(2); // GOLD (700-849)

      // Check events
      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      await expect(tx)
        .to.emit(deFiPassportNFT, "PassportUpdated")
        .withArgs(user1.address, tokenId, newCreditScore);
      await expect(tx)
        .to.emit(deFiPassportNFT, "CreditScoreUpdated")
        .withArgs(tokenId, INITIAL_CREDIT_SCORE, newCreditScore);
    });

    it("should update credit score only", async function () {
      const newCreditScore = 800;
      const tx = await deFiPassportNFT.connect(mainRouter).updateCreditScore(user1.address, newCreditScore);

      // Check updated data
      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(newCreditScore);
      expect(passportData.level).to.equal(2); // GOLD (700-849)

      // Check event
      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      await expect(tx)
        .to.emit(deFiPassportNFT, "CreditScoreUpdated")
        .withArgs(tokenId, INITIAL_CREDIT_SCORE, newCreditScore);
    });

    it("should revert if passport does not exist", async function () {
      await expect(
        deFiPassportNFT
          .connect(mainRouter)
          .updatePassport(user2.address, 750, 200, 2000000, 10, 1, 50)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "PassportDoesNotExist");
    });

    it("should revert if called by unauthorized updater", async function () {
      await expect(
        deFiPassportNFT
          .connect(unauthorized)
          .updatePassport(user1.address, 750, 200, 2000000, 10, 1, 50)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "NotAuthorizedUpdater");
    });
  });

  describe("Updater Management", function () {
    it("should authorize a new updater", async function () {
      const newUpdater = user2.address;
      const tx = await deFiPassportNFT.connect(owner).authorizeUpdater(newUpdater);
      expect(await deFiPassportNFT.authorizedUpdaters(newUpdater)).to.be.true;
      await expect(tx).to.emit(deFiPassportNFT, "UpdaterAuthorized").withArgs(newUpdater);

      // Verify new updater can mint
      await deFiPassportNFT
        .connect(user2)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );
      expect(await deFiPassportNFT.userToTokenId(user1.address)).to.equal(1);
    });

    it("should revoke an updater", async function () {
      const tx = await deFiPassportNFT.connect(owner).revokeUpdater(mainRouter.address);
      expect(await deFiPassportNFT.authorizedUpdaters(mainRouter.address)).to.be.false;
      await expect(tx).to.emit(deFiPassportNFT, "UpdaterRevoked").withArgs(mainRouter.address);

      // Verify revoked updater cannot mint
      await expect(
        deFiPassportNFT
          .connect(mainRouter)
          .mintPassport(
            user1.address,
            INITIAL_CREDIT_SCORE,
            TOTAL_TRANSACTIONS,
            TOTAL_VOLUME_USD,
            PROTOCOLS_USED
          )
      ).to.be.revertedWithCustomError(deFiPassportNFT, "NotAuthorizedUpdater");
    });

    it("should revert if authorizing zero address", async function () {
      await expect(
        deFiPassportNFT.connect(owner).authorizeUpdater(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "ZeroAddress");
    });

    it("should revert if non-owner tries to authorize updater", async function () {
      await expect(
        deFiPassportNFT.connect(user1).authorizeUpdater(user2.address)
      ).to.be.revertedWithCustomError(deFiPassportNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Non-Transferability", function () {
    beforeEach(async function () {
      await deFiPassportNFT
        .connect(mainRouter)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );
    });

    it("should prevent token transfers", async function () {
      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      await expect(
        deFiPassportNFT.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("DeFi Passports are non-transferable");
    });

    it("should prevent safe transfers", async function () {
      const tokenId = await deFiPassportNFT.userToTokenId(user1.address);
      await expect(
        deFiPassportNFT.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user2.address,
          tokenId
        )
      ).to.be.revertedWith("DeFi Passports are non-transferable");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await deFiPassportNFT
        .connect(mainRouter)
        .mintPassport(
          user1.address,
          INITIAL_CREDIT_SCORE,
          TOTAL_TRANSACTIONS,
          TOTAL_VOLUME_USD,
          PROTOCOLS_USED
        );
    });

    it("should return correct passport data", async function () {
      const passportData = await deFiPassportNFT.getUserPassport(user1.address);
      expect(passportData.creditScore).to.equal(INITIAL_CREDIT_SCORE);
    });

    it("should return whether user has passport", async function () {
      expect(await deFiPassportNFT.hasPassport(user1.address)).to.be.true;
      expect(await deFiPassportNFT.hasPassport(user2.address)).to.be.false;
    });

    it("should return correct token ID for user", async function () {
      expect(await deFiPassportNFT.getUserTokenId(user1.address)).to.equal(1);
      expect(await deFiPassportNFT.getUserTokenId(user2.address)).to.equal(0);
    });

    it("should return total supply", async function () {
      expect(await deFiPassportNFT.getTotalSupply()).to.equal(1);
    });
  });
});