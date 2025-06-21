require('dotenv').config();
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment on Sepolia...");
  console.log("Network:", hre.network.name);

  // Sepolia-specific variables
  const routerAddress = process.env.SEPOLIA_ROUTER_ADDRESS;
  const functionsRouterAddress = process.env.SEPOLIA_FUNCTIONS_ROUTER_ADDRESS;
  const donIdString = process.env.SEPOLIA_DON_ID;
  const subscriptionId = process.env.SEPOLIA_SUBSCRIPTION_ID;
  const mainRouterChainSelector = process.env.SEPOLIA_MAIN_ROUTER_CHAIN_SELECTOR ? BigInt(process.env.SEPOLIA_MAIN_ROUTER_CHAIN_SELECTOR) : undefined;
  const initialMinterAddress = process.env.SEPOLIA_INITIAL_MINTER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const donId = hre.ethers.encodeBytes32String(donIdString);

  console.log("Environment variables:");
  console.log("- Router Address:", routerAddress);
  console.log("- Functions Router Address:", functionsRouterAddress);
  console.log("- DON ID (string):", donIdString);
  console.log("- DON ID (bytes32):", donId);
  console.log("- Subscription ID:", subscriptionId);
  console.log("- Main Router Chain Selector:", mainRouterChainSelector?.toString());
  console.log("- Initial Minter Address:", initialMinterAddress);

  // Deploy DeFiPassportNFT
  console.log("\n=== Deploying DeFiPassportNFT ===");
  const DeFiPassportNFT = await hre.ethers.getContractFactory("DeFiPassportNFT");
  const defiPassportNFT = await DeFiPassportNFT.deploy(
    "DeFi Passport NFT",
    "DPNFT",
    "0x0000000000000000000000000000000000000000"
  );
  await defiPassportNFT.waitForDeployment();
  const defiPassportNFTAddress = await defiPassportNFT.getAddress();
  console.log("✅ DeFiPassportNFT deployed to:", defiPassportNFTAddress);

  // Deploy DSC
  console.log("\n=== Deploying DSC ===");
  const DSC = await hre.ethers.getContractFactory("DSC");
  const dsc = await DSC.deploy(
    "DeFi Stablecoin",
    "DSC",
    "0x0000000000000000000000000000000000000000"
  );
  await dsc.waitForDeployment();
  const dscAddress = await dsc.getAddress();
  console.log("✅ DSC deployed to:", dscAddress);

  // Deploy MainRouter
  if (!routerAddress || !functionsRouterAddress || !donIdString || subscriptionId === undefined) {
    throw new Error('SEPOLIA_ROUTER_ADDRESS, SEPOLIA_FUNCTIONS_ROUTER_ADDRESS, SEPOLIA_DON_ID, and SEPOLIA_SUBSCRIPTION_ID must be set in .env for MainRouter deployment');
  }

  console.log("\n=== Deploying MainRouter ===");
  const MainRouter = await hre.ethers.getContractFactory("MainRouter");
  const mainRouter = await MainRouter.deploy(
    routerAddress,
    functionsRouterAddress,
    donId,
    subscriptionId
  );
  await mainRouter.waitForDeployment();
  const mainRouterAddress = await mainRouter.getAddress();
  console.log("✅ MainRouter deployed to:", mainRouterAddress);

  // Deploy Minter
  if (!routerAddress || mainRouterChainSelector === undefined || !mainRouterAddress) {
    throw new Error('SEPOLIA_ROUTER_ADDRESS, SEPOLIA_MAIN_ROUTER_CHAIN_SELECTOR, and MainRouter address must be available for Minter deployment');
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

  // Now configure the contracts
  console.log("\n=== Configuring Contracts ===");

  try {
    // Set MainRouter address in DeFiPassportNFT (if this function exists)
    console.log("Setting MainRouter address in DeFiPassportNFT...");
    const setMainRouterTx = await defiPassportNFT.setMainRouter(mainRouterAddress);
    await setMainRouterTx.wait();
    console.log("✅ MainRouter address set in DeFiPassportNFT");
  } catch (error) {
    console.log("⚠️  Could not set MainRouter in DeFiPassportNFT:", error.message);
  }

  try {
    // Add Minter to DSC (if this function exists)
    console.log("Adding Minter to DSC...");
    const addMinterTx = await dsc.addMinter(minterAddress);
    await addMinterTx.wait();
    console.log("✅ Minter added to DSC");
  } catch (error) {
    console.log("⚠️  Could not add Minter to DSC:", error.message);
  }

  // Summary of deployed contracts
  console.log("\n=== 🎉 Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("DeFiPassportNFT:", defiPassportNFTAddress);
  console.log("DSC:", dscAddress);
  console.log("MainRouter:", mainRouterAddress);
  console.log("Minter:", minterAddress);
  console.log("Depositor:", depositorAddress);

  // Save deployment addresses to a file for future reference
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      DeFiPassportNFT: defiPassportNFTAddress,
      DSC: dscAddress,
      MainRouter: mainRouterAddress,
      Minter: minterAddress,
      Depositor: depositorAddress
    },
    environment: {
      routerAddress,
      functionsRouterAddress,
      donId: donIdString,
      subscriptionId,
      mainRouterChainSelector: mainRouterChainSelector?.toString()
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
