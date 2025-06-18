const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = ethers;

describe("Minter Contract", function () {
  let Minter, minter;
  let DSC, dsc;
  let owner, user1, user2;
  let mockRouter;

  // Constants
  const MAIN_ROUTER_CHAIN_SELECTOR = 1;
  const MAIN_ROUTER_ADDRESS = ethers.Wallet.createRandom().address;
  const DSC_NAME = "DeFi Stablecoin";
  const DSC_SYMBOL = "DSC";
  const OTHER_CHAIN_SELECTOR = 2;
  const OTHER_CHAIN_MINTER = ethers.Wallet.createRandom().address;
  const MINT_AMOUNT = ethers.utils.parseUnits("1000", 18);
  const BURN_AMOUNT = ethers.utils.parseUnits("500", 18);
  const SWAP_AMOUNT = ethers.utils.parseUnits("1000", 18);

  // Mock Router Contract
  const MockRouter = ethers.getContractFactory("MockRouter");

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy mock router
    mockRouter = await (await MockRouter).deploy();

    // Deploy Minter contract
    Minter = await ethers.getContractFactory("Minter");
    minter = await Minter.deploy(
      mockRouter.address,
      MAIN_ROUTER_CHAIN_SELECTOR,
      MAIN_ROUTER_ADDRESS,
      DSC_NAME,
      DSC_SYMBOL
    );

    // Get the deployed DSC token
    dsc = await ethers.getContractAt("DSC", await minter.dscToken());

    // Setup other chain minter
    await minter.setChainMinter(OTHER_CHAIN_SELECTOR, OTHER_CHAIN_MINTER);

    // Fund the contract with ETH for CCIP fees
    await owner.sendTransaction({
      to: minter.address,
      value: ethers.utils.parseEther("1")
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

// Mock contracts
const MockRouterArtifact = {
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        },
        {
          "internalType": "uint64",
          "name": "sourceChainSelector",
          "type": "uint64"
        },
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "message",
          "type": "bytes"
        }
      ],
      "name": "simulateCCIPReceive",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lastResponse",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint64",
          "name": "sourceChainSelector",
          "type": "uint64"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "message",
          "type": "bytes"
        }
      ],
      "name": "MessageReceived",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "requestId",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "response",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "err",
          "type": "bytes"
        }
      ],
      "name": "Response",
      "type": "event"
    }
  ],
  "bytecode": "0x...", // Actual bytecode would go here
  "contractName": "MockRouter",
  "deployedBytecode": "0x...", // Actual deployed bytecode would go here
  "sourceName": "contracts/mocks/MockRouter.sol"
};

// Add mock to Hardhat
ethers.getContractFactory = async function (name, signer) {
  if (name === "MockRouter") {
    return new ethers.ContractFactory(
      MockRouterArtifact.abi,
      MockRouterArtifact.bytecode,
      signer || (await ethers.getSigners())[0]
    );
  }
  return originalGetContractFactory(name, signer);
};

const originalGetContractFactory = ethers.getContractFactory;