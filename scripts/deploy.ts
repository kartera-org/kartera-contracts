import { ethers } from "hardhat";
import { ABI } from './abi'

let karteraToken:any;
let defiBasket:any;
let karteraaddress = "0x1d10450D4cfA9241EaB34Ee7E6b77956E29E6794";
let defiBasketaddress = "0x06cfFb6EDEB4B2E0D15B1b37d007df4ccB88D6a6";

async function main() {
  //get signer account
  const [karteraOwner, addr] = await ethers.getSigners();
  await loadContracts();

  await sendTokens("0x32Bd516d7C5cdD918477632558C01aF2663f3F69", karteraOwner, "0x97A3F3e841c7D3530C930Af20887825fa25dB7dF", '100000');
}

async function sendTokens(tokenaddr:string, signer:any, to:string, amount:string){

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
}

async function deployContracts(){

  //deploy kartera token
  const KarteraToken = await ethers.getContractFactory("KarteraToken");
  let karteraToken = await KarteraToken.deploy();
  console.log('karteraToken contract id: ', karteraToken.address);
  console.log('transaction id: ', karteraToken.deployTransaction.hash);
  await karteraToken.deployed();

  //deploy defiBasket Contract
  const DefiBasket = await ethers.getContractFactory("DefiBasket");
  let defiBasket = await DefiBasket.deploy();
  console.log('defiBasket contract id: ', defiBasket.address);
  console.log('transaction id: ', defiBasket.deployTransaction.hash);
  await defiBasket.deployed();
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