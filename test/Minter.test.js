const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Minter", function () {
  it("should deploy successfully", async function () {
    const Contract = await ethers.getContractFactory("Minter");
    const contract = await Contract.deploy();
    await contract.deployed();
    expect(contract.address).to.properAddress;
  });
});
