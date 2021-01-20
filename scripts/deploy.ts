import { ethers } from "hardhat";

async function main() {
  // const factory = await ethers.getContractFactory("Counter");
  const KarteraToken = await ethers.getContractFactory("KarteraToken");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let karteraToken = await KarteraToken.deploy();

  // The address the Contract WILL have once mined
  console.log('karteraToken contract id: ', karteraToken.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', karteraToken.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await karteraToken.deployed();

  const CryptoTopTen = await ethers.getContractFactory("CryptoTopTen");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let cryptoTopTen = await CryptoTopTen.deploy();

  // The address the Contract WILL have once mined
  console.log('cryptoTopTen contract id: ', cryptoTopTen.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', cryptoTopTen.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await cryptoTopTen.deployed();

  const MockToken1 = await ethers.getContractFactory("MockToken1");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let mockToken1 = await MockToken1.deploy();

  // The address the Contract WILL have once mined
  console.log('mockToken1 contract id: ', mockToken1.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', mockToken1.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await mockToken1.deployed();

  const MockToken2 = await ethers.getContractFactory("MockToken2");

  // If we had constructor arguments, they would be passed into deploy()
  //   let dappToken = await factory.deploy(1000000);
  let mockToken2 = await MockToken2.deploy();

  // The address the Contract WILL have once mined
  console.log('mockToken2 contract id: ', mockToken2.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log('transaction id: ', mockToken2.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await mockToken2.deployed();


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
