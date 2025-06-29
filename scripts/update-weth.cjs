// scripts/update-weth.cjs
const { ethers } = require("hardhat");

const NEW_WETH = "0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534"; // Chainlink Sepolia WETH
const OLD_WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"; // Old unsupported WETH
const depositorAddress = "0x7842D25216Ec9D0606829F2b0b995b5505e7aFDA"; // Deployed Depositor

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`Using network: ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);

  const depositorAbi = [
    "function addSupportedToken(address) external",
    "function removeSupportedToken(address) external",
    "function isTokenSupported(address) view returns (bool)",
    "function owner() view returns (address)",
  ];
  const depositor = await ethers.getContractAt(depositorAbi, depositorAddress);

  // Check ownership
  const owner = await depositor.owner();
  console.log(`Contract owner: ${owner}`);
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Deployer is not the contract owner");
  }

  // Check token support
  const isOldSupported = await depositor.isTokenSupported(OLD_WETH);
  const isNewSupported = await depositor.isTokenSupported(NEW_WETH);
  console.log(`Is OLD_WETH supported? ${isOldSupported}`);
  console.log(`Is NEW_WETH supported? ${isNewSupported}`);

  // Check contract ETH balance
  const contractBalance = await ethers.provider.getBalance(depositorAddress);
  console.log(`Contract ETH balance: ${ethers.formatEther(contractBalance)} ETH`);

  if (isOldSupported) {
    console.log("Removing old WETH...");
    const tx = await depositor.removeSupportedToken(OLD_WETH);
    await tx.wait();
    console.log("❌ Old WETH removed.");
  }

  if (!isNewSupported) {
    console.log("Adding new Chainlink WETH...");
    const tx = await depositor.addSupportedToken(NEW_WETH);
    await tx.wait();
    console.log("✅ New WETH added.");
  } else {
    console.log("✅ New WETH already supported.");
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  if (error.reason) console.error("Revert reason:", error.reason);
  process.exit(1);
});