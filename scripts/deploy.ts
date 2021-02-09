import { ethers } from "hardhat";

let karteraToken:any;
let defiBasket:any;
let karteraPriceOracle:any;
let karteraaddress = "0x1d10450D4cfA9241EaB34Ee7E6b77956E29E6794";
// let defiBasketaddress = "0x06cfFb6EDEB4B2E0D15B1b37d007df4ccB88D6a6";
let defiBasketaddress = '0x5DbA2C3F2ea8BaF8d7C3349aA748C5f0A21cD1d8';
// let karteraPriceOracleAddr = '0x293b6D22E5774c9615E2fb1D3C18B4E36B61C5e8';
let karteraPriceOracleAddr = '0x011A0C72433D230575Ed12bD316D4Be3359C86A4';
let zhiPubAddr = "0xbb31ae334462B9a736EA1DE2a61042BB0B106165";
let erikaPubAdr ='0xc0AE19cf32285582f52991477A2a5fEa844f7A80';

const constituents = [
  {name:'MockAave', addr:'0xefF313696D5513Ab2d7763a967a64d26B0fBB793', weight:25, weightTol:5, claddr:"0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"},
  {name:'MockMkr', addr:'0x93a1d61641750DcA1826DeD628c82188C928307E', weight:10, weightTol:5, claddr:"0x0B156192e04bAD92B6C1C13cf8739d14D78D5701"},
  {name:'MockSnx', addr:'0xbB4B258B362C7d9d07903E8934b45550a4A7F92C', weight:20, weightTol:5, claddr:"0xF9A76ae7a1075Fe7d646b06fF05Bd48b9FA5582e"},
  {name:'MockUni', addr:'0x32Bd516d7C5cdD918477632558C01aF2663f3F69', weight:30, weightTol:5, claddr:"0x17756515f112429471F86f98D5052aCB6C47f6ee"},
  {name:'MockYfi', addr:'0xd9D54E7016306A3009629833C2409Fd04F25A118', weight:15, weightTol:5, claddr:"0xC5d1B1DEb2992738C0273408ac43e1e906086B6C"},
];

async function main() {
  let state;
  await loadContracts();

  const [alice] = await ethers.getSigners();
  let i=0;
  await sendMockTokens(constituents[i].addr, alice, erikaPubAdr, '100000');

  // try{
    state = await defiBasket.acceptingDeposit(constituents[1].addr);
  // }catch(e){
  //   state = false;
  // }
  console.log('accepting deposit: ', state );
  // await deployDefiBasket();

  // await updateConstituentByIndex(4);

}

async function sendMockTokens(tokenaddr:string, signer:any, to:string, amount:string){

  var contract = await ethers.getContractFactory("MockAave");
  var token = await contract.attach(tokenaddr);

  await token.connect(signer).approve(to, ethers.utils.parseEther(amount));
  let tx = await token.transfer(to, ethers.utils.parseEther(amount));

  console.log('tx: ', tx );
}

async function loadContracts() {
  
  const KarteraToken = await ethers.getContractFactory("KarteraToken");
  karteraToken = await KarteraToken.attach(karteraaddress);

  const DefiBasket = await ethers.getContractFactory("DefiBasket");
  defiBasket = await DefiBasket.attach(defiBasketaddress);

  const KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
  karteraPriceOracle = await KarteraPriceOracle.attach(karteraPriceOracleAddr);
}

async function deployKarteraToken(){

  //deploy kartera token
  const KarteraToken = await ethers.getContractFactory("KarteraToken");
  let karteraToken = await KarteraToken.deploy();
  console.log('karteraToken contract id: ', karteraToken.address);
  console.log('transaction id: ', karteraToken.deployTransaction.hash);
  await karteraToken.deployed();
}
async function deployDefiBasket(){

  // //deploy defiBasket Contract
  // const DefiBasket = await ethers.getContractFactory("DefiBasket");
  // let defiBasket = await DefiBasket.deploy();
  // console.log('defiBasket contract id: ', defiBasket.address);
  // console.log('transaction id: ', defiBasket.deployTransaction.hash);
  // await defiBasket.deployed();

  // await defiBasket.setPriceOracleAddress(karteraPriceOracleAddr);

  // let i=0;
  // await defiBasket.addConstituent(constituents[i].addr, constituents[i].weight, constituents[i].weightTol);
  // console.log('done: ', i );

  // let fundBasket = 5e7;
  // await karteraToken.mint(defiBasket.address, ethers.utils.parseEther(fundBasket.toString()))

  // let multiplier = 100;
  // await defiBasket.setIncentiveToken(karteraToken.address, ethers.utils.parseEther(multiplier.toString()))
}

async function deployKarteraPriceOracle() {
  const KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
  karteraPriceOracle = await KarteraPriceOracle.deploy();
  console.log('karteraPrice oracle address: ', karteraPriceOracle.address );
  await karteraPriceOracle.deployed();

  const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
  let link = [constituents[0].claddr, etherCLAddr];
  karteraPriceOracle.addToken(constituents[0].addr, 2, link);

  link = [constituents[1].claddr, etherCLAddr];
  await karteraPriceOracle.addToken(constituents[1].addr, 2, link);

  link = [constituents[2].claddr, etherCLAddr];
  await karteraPriceOracle.addToken(constituents[2].addr, 2, link);

  link = [constituents[3].claddr, etherCLAddr];
  await karteraPriceOracle.addToken(constituents[3].addr, 2, link);

  link = [constituents[4].claddr, etherCLAddr];
  await karteraPriceOracle.addToken(constituents[4].addr, 2, link);

}

async function mintKartera(address:string, amount:string){

  let kartOwnerTokens = 3e7;
  let defiBasketTokens = 3e7;

  await karteraToken.mint(address, ethers.utils.parseEther(amount));
}

async function setIncentivesForDefiBasket(karteraaddress:string, multiplier:string){
  // set incentive token parameters
  await defiBasket.setIncentiveToken(karteraToken.address, ethers.utils.parseEther('100'));
}

async function addBasketConstituent(conAddr:string, weight:number, weightTol:number, claddr:string){
  
  await defiBasket.addConstituent(conAddr, weight, weightTol, claddr);
}

async function updateConstituent(conaddr:string, weight:number, weightTolerance:number){
  await defiBasket.updateConstituent(conaddr, weight, weightTolerance);
}
async function updateConstituentByIndex(indx:number){
  await defiBasket.updateConstituent(constituents[indx].addr, constituents[indx].weight, constituents[indx].weightTol);
}

async function getConstituentDetails(i:number){
  let conAddr = await defiBasket.getConstituentAddress(i);
  console.log('conAddr: ', conAddr );
  let details = await defiBasket.getConstituentDetails(conAddr);
  console.log('details: ', details );

}

const contractList = [
  'MockAave',
  'MockComp',
  'MockMkr',
  'MockSnx',
  'MockSushi',
  'MockUma',
  'MockUni',
  'MockYfi',
];
async function deployMockContracts() {

  for(let i=0; i<contractList.length; i++){
    let Token = await ethers.getContractFactory(contractList[i]);

    let token = await Token.deploy();

    console.log('karteraToken contract id: ', token.address);

    console.log('transaction id: ', token.deployTransaction.hash);

    await token.deployed();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  // const constituents = [
  //   {name:'MockAave', addr:'0xefF313696D5513Ab2d7763a967a64d26B0fBB793', weight:25, weightTol:100, claddr:"0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"},
  //   {name:'MockMkr', addr:'0x93a1d61641750DcA1826DeD628c82188C928307E', weight:10, weightTol:100, claddr:"0x0B156192e04bAD92B6C1C13cf8739d14D78D5701"},
  //   {name:'MockSnx', addr:'0xbB4B258B362C7d9d07903E8934b45550a4A7F92C', weight:20, weightTol:100, claddr:"0xF9A76ae7a1075Fe7d646b06fF05Bd48b9FA5582e"},
  //   {name:'MockUni', addr:'0x32Bd516d7C5cdD918477632558C01aF2663f3F69', weight:30, weightTol:100, claddr:"0x17756515f112429471F86f98D5052aCB6C47f6ee"},
  //   {name:'MockYfi', addr:'0xd9D54E7016306A3009629833C2409Fd04F25A118', weight:15, weightTol:100, claddr:"0xC5d1B1DEb2992738C0273408ac43e1e906086B6C"},
  // ];

// const kovanContracts = [
//     {name:'MockAave', addr:'0xefF313696D5513Ab2d7763a967a64d26B0fBB793'},
//     {name:'MockComp', addr:'0x1D8F91800fB64A5cB61bF017787dD1B72be8C70F'},
//     {name:'MockMkr', addr:'0x93a1d61641750DcA1826DeD628c82188C928307E'},
//     {name:'MockSnx', addr:'0xbB4B258B362C7d9d07903E8934b45550a4A7F92C'},
//     {name:'MockSushi', addr:'0x40717C1049Be241C9fD431Cd1EDE91c2AbFdA218'},
//     {name:'MockUma', addr:'0x07e58CC9fec4AA73B6B39978A1df2EFB94EbDB2a'},
//     {name:'MockUni', addr:'0x32Bd516d7C5cdD918477632558C01aF2663f3F69'},
//     {name:'MockYfi', addr:'0xd9D54E7016306A3009629833C2409Fd04F25A118'},
// ]