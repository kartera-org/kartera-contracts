import { ethers } from "hardhat";
import { UniswapPriceOracle__factory, UniswapPriceOracle } from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

function tokens(n: string) {
  return ethers.utils.parseUnits(n, "ether");
}

const uniswapPriceOracleAddr = "0xfbb8719819E3661Eb33E8B90Aa3C7bEd00349915";
const txid = "0x72c14b6634763407a6b79ca34eb1b16003392c9792772c05901743672967a620";
// const factory_addresss = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
// const rinkeby_weth_address = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
// const rinkeby_mkr_address = "0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85";

async function main() {
    const [owner, addr1] = await ethers.getSigners();

    const UniswapPriceOracle = (await ethers.getContractFactory("UniswapPriceOracle")) as UniswapPriceOracle__factory;
    const uniswapPriceOracle = await UniswapPriceOracle.attach(uniswapPriceOracleAddr);

    await uniswapPriceOracle.update();

    let ethprice = await uniswapPriceOracle.getToken0();
    console.log('eth price: ', ethprice.toString() );

    let mkrprice = await uniswapPriceOracle.getToken1();
    console.log('btc price: ', mkrprice.toString() );

    let prc = await uniswapPriceOracle.consult(ethprice, '1000000000000000000');
    console.log('prc: ', prc.toString() );
  }

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });