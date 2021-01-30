import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { CryptoTopTen__factory, CryptoTopTen } from "../typechain";
// import { MockToken1__factory, MockToken1 } from "../typechain";
// import { MockToken2__factory, MockToken2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


function tokens(n: string) {
    return ethers.utils.parseUnits(n, "ether");
}

const cryptoTopTenAddr =  "0xbF529E43AA262A070C518d209FF6C56d916C0b17";
//transaction id:  0x748a82124ec8bbd5f856a7b0bdffbb386b865c717463e230546263fe8eb70a45;

// const karteraTokenAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
//transaction id:  0x6348ab083fc349f5f6e8ece82f00bec30a4661f3687f7b6510ed0ecb9b4380a3

// const mockToken1Addr = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"
//transaction id:  0x6b43dfc5e6a06b213a35caedac62a4f86c95eab525d43200d9b224d2398b3ae2
// const mockToken2Addr = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9"
//transaction id:  0xc2a5acff9d12819c8afa5a12851791206b292e30ea959bee7af239a96fea856b

const constituents = [
  {name:"wbtc", addr:"0x3BDb41FcA3956A72cd841696bD59ca860F3f0513", claddr:"0xF7904a295A029a3aBDFFB6F12755974a958C7C25"},
  {name:"link", addr:"0xe6a51CF10D43365C179ab54b78e0d875B1364Dc0", claddr:"0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38"},
  {name:"mkr", addr:"0xeD8aff4253e6317D9A7606FF7E3A2C5C5a75ad3a", claddr:"0x0B156192e04bAD92B6C1C13cf8739d14D78D5701"},
  {name:"snx", addr:"0xD43740443390C1C2De839E369B3857bd161C6887", claddr:"0xF9A76ae7a1075Fe7d646b06fF05Bd48b9FA5582e"},
];


async function main() {
  const [owner, addr1] = await ethers.getSigners();
  // console.log('owner: ', owner );
  // console.log('addr1: ', addr1 );
  const accounts = await ethers.provider.listAccounts();
  // console.log(accounts[0]);
  const CryptoTopTen = (await ethers.getContractFactory("CryptoTopTen")) as CryptoTopTen__factory;
  const cryptoTopTen = await CryptoTopTen.attach(cryptoTopTenAddr);
  const consIndx = 1;

  ///////////////////// make deposit //////////////////////////
  // await cryptoTopTen.connect(owner).makeDeposit(constituents[consIndx].addr, "1000000000000000000");

  // let constituentDetails = await cryptoTopTen.getConstituentDetails(constituents[consIndx].addr);
  // console.log('constituent balance in basket: ', constituentDetails );

  // let balance = await cryptoTopTen.balanceOf(accounts[0]);
  // console.log('crypto top ten balance of account[0]: ', balance.toString() );


  // await cryptoTopTen.addConstituent(constituents[consIndx].addr, "5", constituents[consIndx].claddr);

  let totalSupply = await cryptoTopTen.totalSupply();
  console.log('total supply: ', totalSupply.toString() );


  let exchangerate = await cryptoTopTen.exchangneRate(constituents[consIndx].addr);
  console.log('exchange rate: ', exchangerate.toString() );

  // ////////////////get token price //////////////////
  // let tokenprice = await cryptoTopTen.tokenPrice();
  // console.log('current token price: ', tokenprice.toString() );

  // ////////////// get cons price //////////////////////
  // let constituentprice = await cryptoTopTen.constituentPrice(constituents[consIndx].addr);
  // console.log('constituentprice: ', constituentprice.toString() );

  // ////////////////////////// manual exchange rate ///////////////////
  // let amt = constituentprice.toString();
  // console.log('amt: ', amt );
  // exchangerate = await cryptoTopTen.tokensForDeposit(amt);
  // console.log('manual exchange rate: ', exchangerate.toString() );



  // let constituentAddr = await cryptoTopTen.getConstituentAddress(consIndx);
  // let tokenprice = await cryptoTopTen.tokenPrice();
  // console.log('current token price: ', tokenprice.toString() );
  // let constituentprice = await cryptoTopTen.constituentPrice(constituentAddr);
  // console.log('constituentprice: ', constituentprice.toString() );
  // let amt = constituentprice.toString() + "00000000000000000";
  // console.log('amt: ', amt );
  // let exchangerate = await cryptoTopTen.tokensForDeposit(amt);
  // console.log('exchange rate: ', exchangerate.toString() );

  
  // let numberOfConstituents = await cryptoTopTen.numberOfConstituents();
  // console.log('cryptoTopTenAddr #of constituents: ', numberOfConstituents.toString() );

  // let constituentAddr = await cryptoTopTen.getConstituentAddress(3);
  // console.log('constituent addr: ', constituentAddr.toString() );

  // let constituentDetails = await cryptoTopTen.getConstituentDetails(constituentAddr);
  // console.log('constituent balance in basket: ', constituentDetails );

  // let totalsupply = await cryptoTopTen.totalSupply();
  // console.log('Total supply: ', totalsupply.toString() );

  
  // let constituentprice = await cryptoTopTen.constituentPrice(constituentAddr);
  // console.log('btc price: ', constituentprice.toString() );

  // let tokenprice = await cryptoTopTen.tokenPrice();
  // console.log('current token price: ', tokenprice.toString() );

  // // // // await cryptoTopTen.connect(owner).approve(cryptoTopTen.address, "0");
  // await cryptoTopTen.connect(owner).makeDeposit(wbtc_addr, "100000000000000000");

  // constituentDetails = await cryptoTopTen.getConstituentDetails(constituentAddr);
  // console.log('constituent balance in basket: ', constituentDetails );

  // let balance = await cryptoTopTen.balanceOf(accounts[0]);
  // console.log('crypto top ten balance of account[1]: ', balance.toString() );


  //crypto top ten contract functions 




  // //check balance of account 
  // let balance = await karteratoken.balanceOf(accounts[0]);
  // console.log('kartera balance of account[0]: ', balance.toString() );
  // await karteratoken.connect(owner).approve(addr1.address, tokens('1000'));
  // // console.log('res1: ', res1 );
  // await karteratoken.transfer( accounts[1], tokens('1000') );
  // // console.log('res2: ', res2 );

  // balance = await karteratoken.balanceOf(accounts[1]);
  // console.log('kartera balance of account[1]: ', balance.toString() );

  // balance = await karteratoken.balanceOf(accounts[0]);
  // console.log('kartera balance of account[0]: ', balance.toString() );
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });