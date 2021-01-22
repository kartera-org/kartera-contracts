import { ethers } from "hardhat";
import { UniswapPriceOracle__factory, UniswapPriceOracle } from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

function tokens(n: string) {
  return ethers.utils.parseUnits(n, "ether");
}

const uniswapPriceOracleAddr = "0x52480065b0AB39117F737E61AeD44D5E1B0005DE";
const txid = "0x3ca398665516d402c0d7f07d8a050f7de42152324434038516cb06ce4771fc57";
const factory_addresss = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const Weth_address = "0xf3a6679b266899042276804930b3bfbaf807f15b";
const Wbtc_address = "0x3bdb41fca3956a72cd841696bd59ca860f3f0513";

async function main() {
    const [owner, addr1] = await ethers.getSigners();
    const UniswapPriceOracle = (await ethers.getContractFactory("UniswapPriceOracle")) as UniswapPriceOracle__factory;
    const uniswapPriceOracle = await UniswapPriceOracle.attach(uniswapPriceOracleAddr);

  }


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });