import { ethers } from "hardhat";

async function main() {
  // const factory = await ethers.getContractFactory("Counter");
  const CLPriceFeed = await ethers.getContractFactory("CLPriceFeed");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let cLPriceFeed = await CLPriceFeed.deploy();

  // The address the Contract WILL have once mined
  console.log('karteraToken contract id: ', cLPriceFeed.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', cLPriceFeed.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await cLPriceFeed.deployed();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
