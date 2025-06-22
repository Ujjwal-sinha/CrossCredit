require('dotenv').config();
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment on Polygon Amoy...");
  console.log("Network:", hre.network.name);

  // Amoy-specific variables
  const routerAddress = process.env.AMOY_ROUTER_ADDRESS;
  const functionsRouterAddress = process.env.AMOY_FUNCTIONS_ROUTER_ADDRESS;
  const donIdString = process.env.AMOY_DON_ID;
  const subscriptionId = process.env.AMOY_SUBSCRIPTION_ID;
  const mainRouterChainSelector = process.env.AMOY_MAIN_ROUTER_CHAIN_SELECTOR ? BigInt(process.env.AMOY_MAIN_ROUTER_CHAIN_SELECTOR) : undefined;
  const initialMinterAddress = process.env.AMOY_INITIAL_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const donId = hre.ethers.encodeBytes32String(donIdString);

  // You must provide the MainRouter address deployed on the main chain (e.g., Fuji or Sepolia)
  const mainRouterAddress = process.env.AMOY_MAIN_ROUTER_ADDRESS;
  if (!mainRouterAddress) {
    throw new Error('AMOY_MAIN_ROUTER_ADDRESS must be set in .env for cross-chain deployment');
  }

  // Deploy Minter
  if (!routerAddress || mainRouterChainSelector === undefined || !mainRouterAddress) {
    throw new Error('AMOY_ROUTER_ADDRESS, AMOY_MAIN_ROUTER_CHAIN_SELECTOR, and AMOY_MAIN_ROUTER_ADDRESS must be available for Minter deployment');
  }

  console.log("\n=== Deploying Minter ===");
  const Minter = await hre.ethers.getContractFactory("Minter");
  const minter = await Minter.deploy(
    routerAddress,
    mainRouterChainSelector,
    mainRouterAddress,
    "DeFi Stablecoin",
    "DSC"
  );
  await minter.waitForDeployment();
  const minterAddress = await minter.getAddress();
  console.log("✅ Minter deployed to:", minterAddress);

  // Deploy Depositor
  console.log("\n=== Deploying Depositor ===");
  const Depositor = await hre.ethers.getContractFactory("Depositor");
  const depositor = await Depositor.deploy(
    routerAddress,
    mainRouterChainSelector,
    mainRouterAddress
  );
  await depositor.waitForDeployment();
  const depositorAddress = await depositor.getAddress();
  console.log("✅ Depositor deployed to:", depositorAddress);

  // Summary of deployed contracts
  console.log("\n=== 🎉 Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Minter:", minterAddress);
  console.log("Depositor:", depositorAddress);

  // Save deployment addresses to a file for future reference
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      Minter: minterAddress,
      Depositor: depositorAddress
    },
    environment: {
      routerAddress,
      functionsRouterAddress,
      donId: donIdString,
      subscriptionId,
      mainRouterChainSelector: mainRouterChainSelector?.toString(),
      mainRouterAddress
    }
  };

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main().catch((error) => {
  console.error("❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});