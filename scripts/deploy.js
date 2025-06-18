require('dotenv').config();
// Hardhat deploy script for all contracts in contracts/
// Usage: npx hardhat run scripts/deploy.js --network <network>

const hre = require("hardhat");

async function main() {
  // Deploy DeFiPassportNFT
  const DeFiPassportNFT = await hre.ethers.getContractFactory("DeFiPassportNFT");
  const defiPassportNFT = await DeFiPassportNFT.deploy();
  await defiPassportNFT.deployed();
  console.log("DeFiPassportNFT deployed to:", defiPassportNFT.address);

  // Deploy DSC
  const DSC = await hre.ethers.getContractFactory("DSC");
  const dsc = await DSC.deploy();
  await dsc.deployed();
  console.log("DSC deployed to:", dsc.address);

  // Deploy MainRouter
  const MainRouter = await hre.ethers.getContractFactory("MainRouter");
  const mainRouter = await MainRouter.deploy();
  await mainRouter.deployed();
  console.log("MainRouter deployed to:", mainRouter.address);

  // Deploy Minter
  const Minter = await hre.ethers.getContractFactory("Minter");
  const minter = await Minter.deploy();
  await minter.deployed();
  console.log("Minter deployed to:", minter.address);

  // Deploy Depositor using env variables
  const router = process.env.ROUTER_ADDRESS;
  const mainRouterChainSelector = process.env.MAIN_ROUTER_CHAIN_SELECTOR;
  const mainRouterAddress = mainRouter.address;
  if (!router || !mainRouterChainSelector) {
    throw new Error('ROUTER_ADDRESS and MAIN_ROUTER_CHAIN_SELECTOR must be set in .env');
  }
  const Depositor = await hre.ethers.getContractFactory("Depositor");
  const depositor = await Depositor.deploy(router, mainRouterChainSelector, mainRouterAddress);
  await depositor.deployed();
  console.log("Depositor deployed to:", depositor.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
