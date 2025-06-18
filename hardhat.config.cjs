require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true, // Useful for local testing
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
    amoy: {
      url: process.env.AMOY_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155420,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
    fuji: {
      url: process.env.FUJI_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 43113,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      saveDeployments: true,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
};
