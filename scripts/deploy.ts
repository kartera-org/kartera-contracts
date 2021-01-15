import { ethers } from "hardhat";

async function main() {
  // const factory = await ethers.getContractFactory("Counter");
  const factory = await ethers.getContractFactory("KarteraToken");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let karteraToken = await factory.deploy();

  // The address the Contract WILL have once mined
  console.log(karteraToken.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log(karteraToken.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await karteraToken.deployed();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
