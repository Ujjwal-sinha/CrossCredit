const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MainRouter", function () {
  it("should deploy successfully", async function () {
    const Contract = await ethers.getContractFactory("MainRouter");
    const contract = await Contract.deploy();
    await contract.deployed();
    expect(contract.address).to.properAddress;
  });
});
