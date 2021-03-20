// hardhat.config.ts
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";

// TODO: reenable solidity-coverage when it works
// import "solidity-coverage";

const localhost_PRIVATE_KEY = process.env.LOCALHOST_PRIVATE_KEY || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY0 || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""; // well known private key
const PRIVATE_KEY2 = process.env.PRIVATE_KEY2 || ""; // well known private key
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
// const KOVAN_PRIVATE_KEY = process.env.KOVAN_PRIVATE_KEY || "";
const GANACHE_PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY || "";
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ 
      version: "0.6.12", 
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      } 
    }],
  },
  networks: {
    hardhat: {},
    localhost: {
      // gas: 10000000,
      // blockGasLimit: 10000000,
      // gasMultiplier: 10,
      // url: `HTTP://127.0.0.1:8545`,
      // accounts: [localhost_PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      gas:'auto',
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY2],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      gas:'auto',
      gasPrice:100000000000,
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [GANACHE_PRIVATE_KEY]
    },
    bsctestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    },
    bscmainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 100000000
  }
};

export default config;
