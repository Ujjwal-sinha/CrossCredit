require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20", // Chainlink/OpenZeppelin 5 needs this
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // ✅ Needed to fix Stack Too Deep
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true, // ✅ Also enable for older contracts, just in case
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    fuji: {
      url: process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 43113,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
    arbitrumGoerli: {
      url: process.env.ARBITRUM_GOERLI_RPC_URL || "https://goerli-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421613,
    },
    optimismGoerli: {
      url: process.env.OPTIMISM_GOERLI_RPC_URL || "https://goerli.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 420,
    },
    blockdag: {
      url: process.env.BLOCKDAG_RPC_URL || "https://rpc.primordial.bdagscan.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1043,
      gasPrice: 20000000000, // 20 gwei
      gas: 8000000,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",
      optimisticGoerli: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || "",
      blockdag: "no-api-key-needed",
    },
    customChains: [
      {
        network: "blockdag",
        chainId: 1043,
        urls: {
          apiURL: "https://primordial.bdagscan.com/api",
          browserURL: "https://primordial.bdagscan.com/",
        },
      },
    ],
  },
};
