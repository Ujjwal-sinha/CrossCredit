const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Depositor", function () {
  it("should deploy successfully", async function () {
    // Provide dummy args for constructor
    const router = ethers.constants.AddressZero;
    const mainRouterChainSelector = 0;
    const mainRouterAddress = ethers.constants.AddressZero;
    const Contract = await ethers.getContractFactory("Depositor");
    const contract = await Contract.deploy(router, mainRouterChainSelector, mainRouterAddress);
    await contract.deployed();
    expect(contract.address).to.properAddress;
  });
});
