import { ethers } from "hardhat";

async function main() {
  // const factory = await ethers.getContractFactory("Counter");
  // const CLPriceFeed = await ethers.getContractFactory("CLPriceFeed");
  const CryptoTopTen = await ethers.getContractFactory("CryptoTopTen");
  // const UniswapPriceOracle = await ethers.getContractFactory("UniswapPriceOracle");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let cryptoTopTen = await CryptoTopTen.deploy();
  // let uniswapPriceOracle = await UniswapPriceOracle.deploy();

  // The address the Contract WILL have once mined
  console.log('cryptoTopTen contract id: ', cryptoTopTen.address);
  // console.log('UniswapPriceOracle contract id: ', uniswapPriceOracle.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', cryptoTopTen.deployTransaction.hash);
  // console.log('transaction id: ', uniswapPriceOracle.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await cryptoTopTen.deployed();
  // await uniswapPriceOracle.deployed();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
