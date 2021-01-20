import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { CryptoTopTen__factory, CryptoTopTen } from "../typechain";
import { MockToken1__factory, MockToken1 } from "../typechain";
import { MockToken2__factory, MockToken2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


function tokens(n: string) {
    return ethers.utils.parseUnits(n, "ether");
}

const karteraTokenAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
//transaction id:  0x6348ab083fc349f5f6e8ece82f00bec30a4661f3687f7b6510ed0ecb9b4380a3
const cryptoTopTenAddr =  "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
//transaction id:  0x03a4e31da67f978ea57423a13fae73722b7eec20433a5c1ab8268e23ddffaef8
const mockToken1Addr = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"
//transaction id:  0x6b43dfc5e6a06b213a35caedac62a4f86c95eab525d43200d9b224d2398b3ae2
const mockToken2Addr = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9"
//transaction id:  0xc2a5acff9d12819c8afa5a12851791206b292e30ea959bee7af239a96fea856b

async function main() {
  const [owner, addr1] = await ethers.getSigners();
  // console.log('owner: ', owner );
  // console.log('addr1: ', addr1 );
  const accounts = await ethers.provider.listAccounts();
  console.log(accounts[0]);
  const KarteraToken = (await ethers.getContractFactory("KarteraToken")) as KarteraToken__factory;
  const karteratoken = await KarteraToken.attach(karteraTokenAddr);
  let ts = await karteratoken.totalSupply();
  console.log('kartera supply: ', ts.toString() );
  //check balance of account 
  let balance = await karteratoken.balanceOf(accounts[0]);
  console.log('kartera balance of account[0]: ', balance.toString() );
  await karteratoken.connect(owner).approve(addr1.address, tokens('1000'));
  // console.log('res1: ', res1 );
  await karteratoken.transfer( accounts[1], tokens('1000') );
  // console.log('res2: ', res2 );

  balance = await karteratoken.balanceOf(accounts[1]);
  console.log('kartera balance of account[1]: ', balance.toString() );

  balance = await karteratoken.balanceOf(accounts[0]);
  console.log('kartera balance of account[0]: ', balance.toString() );
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });