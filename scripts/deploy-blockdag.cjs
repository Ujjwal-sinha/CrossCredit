
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting CrossCredit deployment on BlockDAG Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BDAG");

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("❌ Insufficient BDAG balance for deployment. Need at least 0.1 BDAG");
  }

  console.log("\n" + "=".repeat(50));
  console.log("📦 Deploying CrossCredit Token...");
  console.log("=".repeat(50));

  // Deploy CrossCredit Token
  const CrossCreditToken = await ethers.getContractFactory("CrossCreditToken");
  const crossCreditToken = await CrossCreditToken.deploy();
  await crossCreditToken.waitForDeployment();
  
  const tokenAddress = await crossCreditToken.getAddress();
  console.log("✅ CrossCredit Token deployed to:", tokenAddress);
  
  // Wait for deployment confirmation
  console.log("⏳ Waiting for deployment confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("\n" + "=".repeat(50));
  console.log("🌉 Deploying BlockDAG Router...");
  console.log("=".repeat(50));

  // Deploy BlockDAG Router
  const BlockDAGRouter = await ethers.getContractFactory("BlockDAGRouter");
  const blockDAGRouter = await BlockDAGRouter.deploy(tokenAddress);
  await blockDAGRouter.waitForDeployment();
  
  const routerAddress = await blockDAGRouter.getAddress();
  console.log("✅ BlockDAG Router deployed to:", routerAddress);

  // Wait for deployment confirmation
  console.log("⏳ Waiting for deployment confirmation...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("\n" + "=".repeat(50));
  console.log("⚙️  Configuring contracts...");
  console.log("=".repeat(50));

  // Configure CrossCredit Token with Router
  try {
    console.log("📝 Adding router as authorized operator...");
    const tx1 = await crossCreditToken.transferOwnership(routerAddress);
    await tx1.wait();
    console.log("✅ Router authorized successfully");
  } catch (error) {
    console.log("⚠️  Router authorization failed (may need manual setup):", error.message);
  }

  // Verify token parameters
  const tokenName = await crossCreditToken.name();
  const tokenSymbol = await crossCreditToken.symbol();
  const totalSupply = await crossCreditToken.totalSupply();
  const decimals = await crossCreditToken.decimals();
  const sendFee = await crossCreditToken.sendFee();
  const receiveFee = await crossCreditToken.receiveFee();

  console.log("\n" + "=".repeat(50));
  console.log("📊 Token Configuration");
  console.log("=".repeat(50));
  console.log("📛 Name:", tokenName);
  console.log("🔤 Symbol:", tokenSymbol);
  console.log("🔢 Decimals:", decimals);
  console.log("💰 Total Supply:", ethers.formatEther(totalSupply), "XCC");
  console.log("📤 Send Fee:", (Number(sendFee) / 100).toFixed(2) + "%");
  console.log("📥 Receive Fee:", (Number(receiveFee) / 100).toFixed(2) + "%");

  // Verify router parameters
  const chainId = await blockDAGRouter.BLOCKDAG_CHAIN_ID();
  const minTransfer = await blockDAGRouter.MIN_TRANSFER_AMOUNT();
  const maxTransfer = await blockDAGRouter.MAX_TRANSFER_AMOUNT();

  console.log("\n" + "=".repeat(50));
  console.log("🌉 Router Configuration");
  console.log("=".repeat(50));
  console.log("🆔 Chain ID:", chainId.toString());
  console.log("📉 Min Transfer:", ethers.formatEther(minTransfer), "XCC");
  console.log("📈 Max Transfer:", ethers.formatEther(maxTransfer), "XCC");

  // Test some supported chains
  console.log("\n" + "=".repeat(50));
  console.log("🔗 Supported Chains");
  console.log("=".repeat(50));
  
  const testChains = [1, 11155111, 137, 42161, 10, 43114];
  for (const chainId of testChains) {
    try {
      const [supported, name] = await blockDAGRouter.getChainInfo(chainId);
      if (supported) {
        console.log(`✅ ${name} (${chainId})`);
      }
    } catch (error) {
      console.log(`❌ Chain ${chainId}: Error checking`);
    }
  }

  // Create deployment summary
  const deploymentInfo = {
    network: "BlockDAG Testnet",
    chainId: 1043,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CrossCreditToken: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatEther(totalSupply),
        sendFee: Number(sendFee),
        receiveFee: Number(receiveFee)
      },
      BlockDAGRouter: {
        address: routerAddress,
        chainId: Number(chainId),
        minTransfer: ethers.formatEther(minTransfer),
        maxTransfer: ethers.formatEther(maxTransfer)
      }
    },
    networkConfig: {
      name: "Primordial BlockDAG Testnet",
      chainId: 1043,
      rpcUrl: "https://rpc.primordial.bdagscan.com",
      explorerUrl: "https://primordial.bdagscan.com/",
      currencySymbol: "BDAG"
    }
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, "blockdag-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Deployment Summary");
  console.log("=".repeat(50));
  console.log("🌐 Network: BlockDAG Testnet (1043)");
  console.log("🪙  Token Contract:", tokenAddress);
  console.log("🌉 Router Contract:", routerAddress);
  console.log("📁 Deployment info saved to:", deploymentFile);
  console.log("🔍 Explorer URLs:");
  console.log(`   Token: https://primordial.bdagscan.com/address/${tokenAddress}`);
  console.log(`   Router: https://primordial.bdagscan.com/address/${routerAddress}`);

  console.log("\n" + "=".repeat(50));
  console.log("📋 Next Steps");
  console.log("=".repeat(50));
  console.log("1. 📝 Update frontend config with new contract addresses");
  console.log("2. 🔗 Configure cross-chain bridge operators");
  console.log("3. 💰 Fund router contract with initial BDAG for gas");
  console.log("4. 🧪 Run integration tests on testnet");
  console.log("5. 🚀 Deploy on other networks for cross-chain functionality");

  console.log("\n" + "=".repeat(50));
  console.log("💻 Frontend Integration");
  console.log("=".repeat(50));
  console.log("Add to your config file:");
  console.log(`
const BLOCKDAG_CONFIG = {
  chainId: 1043,
  name: "BlockDAG Testnet",
  rpcUrl: "https://rpc.primordial.bdagscan.com",
  explorerUrl: "https://primordial.bdagscan.com/",
  nativeCurrency: {
    name: "BDAG",
    symbol: "BDAG",
    decimals: 18
  },
  contracts: {
    CrossCreditToken: "${tokenAddress}",
    BlockDAGRouter: "${routerAddress}"
  }
};
  `);

  console.log("\n✨ Deployment completed successfully! ✨");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
