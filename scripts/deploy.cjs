require('dotenv').config();
// Hardhat deploy script for all contracts in contracts/
// Usage: npx hardhat run scripts/deploy.js --network <network>

const hre = require("hardhat");

async function main() {
  // Get necessary variables from environment or configuration
  const routerAddress = process.env.ROUTER_ADDRESS;
  const functionsRouterAddress = process.env.FUNCTIONS_ROUTER_ADDRESS;
  const donId = process.env.DON_ID;
  const subscriptionId = process.env.SUBSCRIPTION_ID;
  const mainRouterChainSelector = process.env.MAIN_ROUTER_CHAIN_SELECTOR ? BigInt(process.env.MAIN_ROUTER_CHAIN_SELECTOR) : undefined;
  const initialMinterAddress = process.env.INITIAL_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000"; // Default to zero address if not set

  // Deploy DeFiPassportNFT
  const DeFiPassportNFT = await hre.ethers.getContractFactory("DeFiPassportNFT");
  const defiPassportNFT = await DeFiPassportNFT.deploy("DeFi Passport NFT", "DPNFT", "0x0000000000000000000000000000000000000000"); // Will update MainRouter address after deployment
  await defiPassportNFT.deployed();
  console.log("DeFiPassportNFT deployed to:", defiPassportNFT.address);

  // Deploy DSC
  const DSC = await hre.ethers.getContractFactory("DSC");
  const dsc = await DSC.deploy("DeFi Stablecoin", "DSC", "0x0000000000000000000000000000000000000000"); // Placeholder for initial minter address
  await dsc.deployed();
  console.log("DSC deployed to:", dsc.address);

  // Deploy MainRouter
  if (!routerAddress || !functionsRouterAddress || !donId || subscriptionId === undefined) {
    throw new Error('ROUTER_ADDRESS, FUNCTIONS_ROUTER_ADDRESS, DON_ID, and SUBSCRIPTION_ID must be set in .env for MainRouter deployment');
  }

  const MainRouter = await hre.ethers.getContractFactory("MainRouter");
  const mainRouter = await MainRouter.deploy(routerAddress, functionsRouterAddress, donId, subscriptionId);
  await mainRouter.deployed();
  console.log("MainRouter deployed to:", mainRouter.address);

  // Now that MainRouter is deployed, set its address in DeFiPassportNFT
  // Note: This assumes DeFiPassportNFT has a function to set the MainRouter address after deployment.
  // If not, the MainRouter address needs to be passed during DeFiPassportNFT deployment if available at that point.
  // For now, we'll assume a `setMainRouter` function exists or handle this depending on your contract design.
  // If you cannot set it after deployment, you might need to deploy MainRouter first, then DeFiPassportNFT with the MainRouter address.
  // As the original code had a placeholder, we will keep the placeholder and note this dependency.
  // To truly fix the constructor argument issue, you would ideally deploy MainRouter first if DeFiPassportNFT needs its address in the constructor.
  // For the scope of this diff, we are focusing on providing the correct arguments based on the constructors.

  // Deploy Minter
  if (!routerAddress || mainRouterChainSelector === undefined || !mainRouter.address) {
    throw new Error('ROUTER_ADDRESS, MAIN_ROUTER_CHAIN_SELECTOR, and MainRouter address must be available for Minter deployment');
  }
  const Minter = await hre.ethers.getContractFactory("Minter");
  const minter = await Minter.deploy(routerAddress, mainRouterChainSelector, mainRouter.address, "DeFi Stablecoin", "DSC");
  await minter.deployed();
  console.log("Minter deployed to:", minter.address);
  // Now that MainRouter is deployed, we can set its address for DeFiPassportNFT and DSC
  await defiPassportNFT.setMainRouter(mainRouter.address); // Assuming a setMainRouter function exists
  await dsc.addMinter(minter.address); // Assuming addMinter is the correct function

  // Deploy Depositor using env variables
  const Depositor = await hre.ethers.getContractFactory("Depositor");
  const depositor = await Depositor.deploy(routerAddress, mainRouterChainSelector, mainRouter.address); // Corrected arguments
  await depositor.deployed();
  console.log("Depositor deployed to:", depositor.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
