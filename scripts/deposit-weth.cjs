// scripts/deposit-weth.cjs
const { ethers } = require("hardhat");

async function depositWETH() {
  const NEW_WETH = "0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534";
  const depositorAddress = "0x7842D25216Ec9D0606829F2b0b995b5505e7aFDA";
  const depositor = await ethers.getContractAt(
    ["function depositToken(address token, uint256 amount) external"],
    depositorAddress
  );
  const amount = ethers.parseEther("0.01"); // Deposit 0.01 WETH
  try {
    const tx = await depositor.depositToken(NEW_WETH, amount);
    const receipt = await tx.wait();
    console.log(`Deposited ${ethers.formatEther(amount)} WETH`);
    console.log(`Transaction hash: ${tx.hash}`);
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Deposit failed:", error.message);
    if (error.reason) {
      console.error("Revert reason:", error.reason);
    } else if (error.data) {
      console.error("Raw error data:", error.data);
      const iface = new ethers.Interface([
        "error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees)",
        "error InsufficientTokenBalance(uint256 required, uint256 available)",
        "error ZeroAmount()",
        "error TokenNotSupported(address token)",
        "error DestinationChainNotAllowed(uint64 destinationChainSelector)",
      ]);
      try {
        const decodedError = iface.parseError(error.data);
        console.error("Decoded revert reason:", decodedError.name, decodedError.args);
      } catch (parseError) {
        console.error("Could not parse error data:", parseError.message);
      }
    } else {
      console.error("No error data available. Check transaction logs on Etherscan.");
    }
  }
}

depositWETH().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});