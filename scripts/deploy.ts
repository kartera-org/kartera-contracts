import { ethers } from "hardhat";
import { GovernorAlpha, KarteraToken } from "../typechain";
const { expectRevert, time } = require('@openzeppelin/test-helpers');
import * as fs from 'fs';
import * as path from 'path';

let karteraToken:any;
let ethBasket:any;
let defiBasket:any;
let karteraPriceOracle:any;
let gov:any;
let timelock:any;
let basketLib:any;
// // eth on kovan
// const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
// eth on Rinkeby
const etherCLAddr = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e';
// let karteraaddress = "0x1d10450D4cfA9241EaB34Ee7E6b77956E29E6794";
// let defiBasketaddress = '0x690ec9bC4D843002Cb8c12D0F940e415BefDE3F2';
// let karteraPriceOracleAddr = '0x011A0C72433D230575Ed12bD316D4Be3359C86A4';

// let govaddress = '0x03c1a459113790247deab13edd2c73cf05d9e002';
// let timelockaddress = '0xd1631e9ad08726a6b67d1495034324b831643c06';

let zhiPubAddr = "0xbb31ae334462B9a736EA1DE2a61042BB0B106165";
let erikaPubAdr ='0xc0AE19cf32285582f52991477A2a5fEa844f7A80';
let jaiPubAddr ='0x0467C705ce681d25a4f5E44BA7252973C6d305B1';

let constituents = [
  {name:'Ether', addr:'0x0000000000000000000000000000000000000001', weight:40, weightTol:5, claddr:"0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"},
  {name:'MockAave', addr:'0xefF313696D5513Ab2d7763a967a64d26B0fBB793', weight:15, weightTol:5, claddr:"0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"},
  {name:'MockMkr', addr:'0x93a1d61641750DcA1826DeD628c82188C928307E', weight:15, weightTol:5, claddr:"0x0B156192e04bAD92B6C1C13cf8739d14D78D5701"},
  {name:'MockSnx', addr:'0xbB4B258B362C7d9d07903E8934b45550a4A7F92C', weight:10, weightTol:5, claddr:"0xF9A76ae7a1075Fe7d646b06fF05Bd48b9FA5582e"},
  {name:'MockUni', addr:'0x32Bd516d7C5cdD918477632558C01aF2663f3F69', weight:10, weightTol:5, claddr:"0x17756515f112429471F86f98D5052aCB6C47f6ee"},
  {name:'MockYfi', addr:'0xd9D54E7016306A3009629833C2409Fd04F25A118', weight:10, weightTol:5, claddr:"0xC5d1B1DEb2992738C0273408ac43e1e906086B6C"},
];

let constituentsRinkeby = [
  {name:'Ether', addr:'0x0000000000000000000000000000000000000001', weight:40, weightTol:5, claddr:"0x8A753747A1Fa494EC906cE90E9f37563A8AF630e"},
  {name:'MockBTC', addr:'0x55C95F29D342aEEd136925D352609635024722a2', weight:15, weightTol:5, claddr:"0xECe365B379E1dD183B20fc5f022230C044d51404"},
  {name:'MockLink', addr:'0x04b09a0ec9fFd4072Ac0131Bd85C8FC8A4451a70', weight:15, weightTol:5, claddr:"0xd8bD0a1cB028a31AA859A21A3758685a95dE4623"},
  {name:'MockSnx', addr:'0xc9C62fBc0a1f8A360Bf90AB876AA56B4DDEbb750', weight:10, weightTol:5, claddr:"0xE96C4407597CD507002dF88ff6E0008AB41266Ee"},
];

/** Ganache deployed contract information
 * alice:  0x237842f1dA167E0E7d528cD1b4AeA0c8BcF43fb5
 * kartera address:  0x2faC449F24D8916cD5Ef5982565c3cCAE7F4B99A
 * timelock address:  0x740613af1EBbB1bDCca4b15A85adBbF6B4687b76
 * gov address:  0xc433c1979917C686B265675b68068B48a7096d8E
 * 
 */

async function main() {

  await loadContracts('rinkeby');

  // let prc = await karteraPriceOracle.price(constituents[1].addr);
  // console.log('price: ', prc.toString() );
  
  
  // await deployMockContracts()
  
  // await deployKarteraToken();

  await deployKarteraPriceOracle();


  // const [alice, bob, carol] = await ethers.getSigners();


  // await deployOnKovan();

  // let bal = await karteraToken.balanceOf(defiBasket.address);
  // let bal = await defiBasket.constituentPrice();
  // console.log('bal: ', ethers.utils.formatUnits(bal) );

  //////////////////////////////////////////////
  //////////////////////////////////////////////
  // await deployDefiBasket();
  // await deployBasketLib(defiBasket.address, karteraPriceOracle.address)
  // console.log('done basket lib deploy: ',  );
  // await defiBasket.setBasketLib(basketLib.address);
  // console.log('done setting lib to defibasket: ',  );

  // await defiBasket.transferOwnership(timelock.address);
  // console.log('transfering ownership of defibasket to timelock done: ',  );
  // for(let i=0; i<constituents.length; i++){
  //   await defiBasket.addConstituent(constituents[i].addr, constituents[i].weight, constituents[i].weightTol);
  //   console.log('done: ', i );
  // }
  //////////////////////////////////////////////
  //////////////////////////////////////////////

  // console.log('timelock addr: ', timelock.address );


  
  // await timelock.setPendingAdmin(gov.address);
  // await gov.__acceptAdmin();
  // await defiBasket.transferOwnership(timelock.address);

  // let  aliceKartBal = await  karteraToken.balanceOf(alice.address);
  // console.log('aliceKartBal: ',  ethers.utils.formatUnits(aliceKartBal));

  // let  karterats = await  karteraToken.totalSupply();
  // console.log('aliceKartBal: ',  ethers.utils.formatUnits(karterats));

  // await karteraToken.delegate(alice.address);

  // let proposalTX = await gov.propose([defiBasket.address], ['0'], ['activateConstituent(address)'], [encodeParameters(['address'], [constituents[0].addr])], 'Activate mockAave ');

  // decodeGovTX(proposalTX.data);
  
  // let proposalid = '3';

  // await karteraToken.delegate(alice.address);

  // await castVote(proposalid, true, alice);
  // // await gov.connect(alice).castVote(proposalid, true);

  // await getProposalInformation(proposalid);
  // let state = await gov.state(proposalid);
  // console.log('proposal state: ', state );

  // await gov.queue(proposalid);
  // let tx = await gov.execute(proposalid);

  // let receipt = await gov.getReceipt(proposalid, alice.address);
  // console.log('receipt: ', receipt.toString() );




  // let data = fs.readFileSync('/mnt/data/projects/kartera-private/scripts/contractAddresses.txt', 'utf8');
  // let lines = data.split('##')
  // console.log('res: ', lines[0]);

  // const [alice, bob, carol] = await ethers.getSigners();
  // await deployMockContracts();
  // await deployGov ();

  // localhost contracts 
  // alice:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  // karteraaddress = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
  // defiBasketaddress = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
  // let timelockaddress ='0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e';
  // let govaddress = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
    
  // constituents=[
  //   {name:'MockAave', addr:'0x5FbDB2315678afecb367f032d93F642f64180aa3', weight:20, weightTol:5, claddr:''},
  //   {name:'MockComp', addr:'0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', weight:15, weightTol:5, claddr:''},
  //   {name:'MockMkr', addr:'0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', weight:15, weightTol:5, claddr:''},
  //   {name:'MockSnx', addr:'0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', weight:10, weightTol:5, claddr:''},
  //   {name:'MockSushi', addr:'0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', weight:10, weightTol:5, claddr:''},
  //   {name:'MockUma', addr:'0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', weight:10, weightTol:5, claddr:''},
  //   {name:'MockUni', addr:'0x0165878A594ca255338adfa4d48449f69242Eb8F', weight:10, weightTol:5, claddr:''},
  //   {name:'MockYfi', addr:'0xa513E6E4b8f2a923D98304ec87F64353C4D5C853', weight:10, weightTol:5, claddr:''},
  // ];
  // const KarteraToken = await ethers.getContractFactory('KarteraToken');
  // karteraToken = await KarteraToken.attach(karteraaddress);
  // await karteraToken.mint(bob.address, ethers.utils.parseEther('50000'));
  // let bobbal = await karteraToken.balanceOf(bob.address);
  // console.log('bobbal: ', ethers.utils.formatUnits(bobbal) );
  // const DefiBasket = await ethers.getContractFactory('DefiBasket');
  // defiBasket = await DefiBasket.attach(defiBasketaddress);
  // // console.log('defibasket addr: ', defiBasket.address );
  // // let manager = await defiBasket.getManager();
  // // console.log('manager: ', manager );

  // const GovToken = await ethers.getContractFactory("GovernorAlpha");
  // gov = await GovToken.attach(govaddress);
  // await defiBasket.addConstituent(constituents[0].addr, constituents[0].weight, constituents[0].weightTol)
  // await defiBasket.addConstituent(constituents[1].addr, constituents[1].weight, constituents[1].weightTol)
  // await defiBasket.addConstituent(constituents[2].addr, constituents[2].weight, constituents[2].weightTol)

  // let n = await defiBasket.numberOfActiveConstituents();
  // console.log('numberOfActiveConstituents: ', n.toString() );
  // // await defiBasket.connect(alice).addConstituent(constituents[3].addr, constituents[3].weight, constituents[3].weightTol);

  // await karteraToken.connect(bob).delegate(bob.address);

  // let priorvotes = await karteraToken.

  // let ts = await karteraToken.totalSupply();
  // console.log('kart total supply: ', ethers.utils.formatUnits(ts) );
  // await karteraToken.mint(bob.address, ethers.utils.parseEther('1'));
  // let indx = 0;
  // let proposalTX = await gov.connect(bob).propose([defiBasket.address], ['0'], ['addConstituent(address,uint8,uint8)'],[encodeParameters(['address', 'uint8', 'uint8'], [constituents[indx].addr, constituents[indx].weight, constituents[indx].weightTol])], 'Add new constituent to defibasket',)

  // decodeGovTX(proposalTX.data);

  // let proposalInfo = await getProposalInformation(proposalid);
  
  // await castVote(proposalid, true, bob);

  // for (let i = 0; i < 100; ++i) {
  //   await time.advanceBlock();
  // }
  
  // let proposalstate = await gov.state(proposalid);
  // console.log('proposal state: ', proposalstate.toString() );

  // await karteraToken.mint(carol.address, ethers.utils.parseEther('10'));

  // await gov.queue(proposalid);
  // await time.increase(time.duration.days(3));
  // let tx = await gov.execute(proposalid);
  // console.log('execution tx: ', tx.toString() );
  // // let receipt = await gov.getReceipt(proposalid, bob.address);
  // // console.log('bob receipt: ', receipt.toString() );

  // n = await defiBasket.numberOfActiveConstituents();
  // console.log('numberOfActiveConstituents after proposal execution: ', n.toString() );

  // let info = ethers.utils.defaultAbiCoder.decode([ 'address', 'uint8', 'uint8' ], proposalInfo);
  // console.log('input data: ', info );

  // await loadContracts();

  // let ts = await defiBasket.totalSupply();
  // console.log('ts: ', ethers.utils.formatUnits(ts) );
  
  // await deployDefiBasket();


  // await defiBasket.addConstituent(constituents[0].addr, constituents[0].weight, constituents[0].weightTol)

  // let details = await defiBasket.getConstituentDetails(constituents[0].addr);
  // console.log('details: ', details );

  // let n = await defiBasket.numberOfActiveConstituents();
  // console.log('n: ', n.toString() );

  // await defiBasket.removeConstituent(constituents[0].addr);

  // n = await defiBasket.numberOfActiveConstituents();
  // console.log('n: ', n.toString() );

  // await sendMockTokens( constituents[0].addr, alice, jaiPubAddr, '100000');
  // await sendMockTokens( constituents[1].addr, alice, jaiPubAddr, '100000');
  // await sendMockTokens( constituents[2].addr, alice, jaiPubAddr, '100000');
  // await sendMockTokens( constituents[3].addr, alice, jaiPubAddr, '100000');
  // await sendMockTokens( constituents[4].addr, alice, jaiPubAddr, '100000');
  // await karteraToken.approve('0x585d07Af62616C17803f655A925C73d7759Bc986', ethers.utils.parseEther('10'));
  // let tx = await karteraToken.transfer('0x585d07Af62616C17803f655A925C73d7759Bc986', ethers.utils.parseEther('10'));
  // console.log('tx: ', tx );
  // await time.advanceBlock();

  // await proposalState('1');
  // await getReceipt('1', alice.address)

  // await castVote('1', true, alice);

  // await getReceipt('1', alice.address)

  // let info = await getProposalInformation('1');
  // for(let i=0; i<info.length; i++){
  //   console.log(i, ': ', info[i].toString() );
  // }

  // await makeProposal();

  // await testDeployGov();
  
  // await loadContracts();

  // const [alice] = await ethers.getSigners();
  // let i=0;
  // await sendMockTokens(constituents[i].addr, alice, erikaPubAdr, '100000');

  // try{
    // state = await defiBasket.acceptingDeposit(constituents[1].addr);
  // }catch(e){
  //   state = false;
  // }
  // console.log('accepting deposit: ', state );
  // await deployDefiBasket();

  // await updateConstituentByIndex(4);

  console.log('done...');

}

async function deployOnKovan(){

  // let EthBasket = await ethers.getContractFactory("EthBasket");
  // ethBasket = await EthBasket.deploy();
  // await ethBasket.deployed()

  console.log('ethbasket address: ', ethBasket.address);

  // let BasketLib = await ethers.getContractFactory("BasketLib");
  // basketLib = await BasketLib.deploy(ethBasket.address, karteraPriceOracle.address, karteraToken.address);
  // await basketLib.deployed();

  console.log('basketLib address: ', basketLib.address);


  await basketLib.transferManager(ethBasket.address);
  console.log('basketLib.transferManager');

  await ethBasket.setBasketLib(basketLib.address);
  console.log('ethBasket.setBasketLib');

  ethBasket.setGovernanceToken(karteraToken.address, ethers.utils.parseEther('100'));
  console.log('ethBasket.setGovernanceToken');

  ethBasket.setWithdrawCost(ethers.utils.parseEther('1000'));
  console.log('ethBasket.setWithdrawCost');

  ethBasket.transferOwnership( timelock.address);
  console.log('ethBasket.transferOwnership');


  for(let i=0; i<6; i++){
    await ethBasket.addConstituent(constituents[i].addr, constituents[i].weight, constituents[i].weightTol);
    console.log('done: ', i );
  }

  await karteraToken.mint(ethBasket.address, ethers.utils.parseEther('10000000'));

  await ethBasket.unpause()
  console.log('ethBasket.unpause');
  
}


function encodeParameters(types:any, values:any) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

async function makeProposal() {
  const [alice] = await ethers.getSigners();

  // karteraaddress = "0x2faC449F24D8916cD5Ef5982565c3cCAE7F4B99A";
  // let govaddress = "0xc433c1979917C686B265675b68068B48a7096d8E";

  // const KarteraToken = await ethers.getContractFactory("KarteraToken");
  // karteraToken = await KarteraToken.attach(karteraaddress);

  // const GovAlpha = await ethers.getContractFactory("GovernorAlpha");
  // let gov  = await GovAlpha.attach(govaddress);

  // await karteraToken.connect(alice).delegate(alice.address);

  // let tx = await gov.connect(alice).propose(
  //   [karteraToken.address], ['0'], ['mint(address,uint256)'],
  //   [encodeParameters(['address','uint256'], [alice.address, ethers.utils.parseEther('25000000')])],
  //   'Mint 25m more kartera tokens to defiBasket',
  // );

  // decodeGovTX(tx.data);
}

function decodeGovTX(data:any) {
  let info = ethers.utils.defaultAbiCoder.decode([ 'address[]', 'uint[]', 'string[]', 'bytes[]', 'string' ], ethers.utils.hexDataSlice(data, 4));

  console.log('proposal TX info: ', info );
}

async function getProposalInformation(id:string){
  let proposal = await gov.getActions('1');
  console.log('target: ', proposal );

  console.log('target: ', proposal[0] );
  console.log('signature: ', proposal[2] );

  let inputs = proposal[2].toString().split('(');
  inputs = inputs[1].split(')');
  inputs = inputs[0].split(',');

  let info = ethers.utils.defaultAbiCoder.decode( inputs, proposal.calldatas[0]);
  console.log('call datas: ', info );

  return proposal;
}

async function getReceipt (id:string, addr:string) {
  let receipt = await gov.getReceipt(id, addr);
  console.log('receipt: ', receipt.votes.toString() );
}

async function castVote(id:string, support:boolean, signer:any) {

  await gov.connect(signer).castVote(id, support);

}

async function proposalState(id:string) {
  // let govaddress = "0xc433c1979917C686B265675b68068B48a7096d8E";
  // const GovAlpha = await ethers.getContractFactory("GovernorAlpha");
  // let gov  = await GovAlpha.attach(govaddress);

  let state = await gov.state(id);

  console.log('state: ', state );

}

async function deployGov () {

  const [alice] = await ethers.getSigners();

  const Timelock = await ethers.getContractFactory('Timelock');
  let timelock = await Timelock.deploy(alice.address, time.duration.days(2).toString())
  console.log('timelock address: ', timelock.address );

  const GovAlpha = await ethers.getContractFactory('GovernorAlpha');
  let gov = await GovAlpha.deploy(timelock.address, karteraToken.address, alice.address);
  console.log('gov address: ', gov.address );

  await timelock.setPendingAdmin(gov.address);
  await gov.__acceptAdmin();

}

async function sendMockTokens(tokenaddr:string, signer:any, to:string, amount:string){

  var contract = await ethers.getContractFactory("MockAave");
  var token = await contract.attach(tokenaddr);

  await token.connect(signer).approve(to, ethers.utils.parseEther(amount));
  let tx = await token.transfer(to, ethers.utils.parseEther(amount));

  console.log('tx: ', tx['hash'] );
}

function getContractAddress(chain:string, contract:string): any {
  try{
    let data = fs.readFileSync(path.resolve(__dirname, './contractAddresses.txt'), 'utf8');
    let lines = data.split('##')
    for(let i=0; i<lines.length; i++){
      if(lines[i].includes(chain)){
        let values = lines[i].split('\n');
        for(let j=1; j<values.length; j++){
          if(values[j].includes(contract)){
            let item = values[j].split(':');
            return item[1];
          }
        }
      }
    }
  }catch(e){
    console.log('error in file read: ', e );
    return '';
  }
}

async function loadContracts(network:string) {
  /**
   * contract addresses used 
   */
  let karteraAddress = getContractAddress(network, 'karteraAddress');
  let karteraPriceOracleAddress = getContractAddress(network, 'karteraPriceOracleAddress');
  // let defiBasketAddress = getContractAddress(network, 'defiBasketAddress');
  // let ethBasketAddress = getContractAddress(network, 'ethBasketAddress');
  // let ethBasketLibAddress = getContractAddress(network, 'basketLibAddress');
  // let govAddress = getContractAddress(network, 'govAddress');
  // let timelockAddress = getContractAddress(network, 'timelockAddress');
  
  const KarteraToken = await ethers.getContractFactory("KarteraToken");
  karteraToken = await KarteraToken.attach(karteraAddress);

  const KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
  karteraPriceOracle = await KarteraPriceOracle.attach(karteraPriceOracleAddress);

  // const DefiBasket = await ethers.getContractFactory("DefiBasket");
  // defiBasket = await DefiBasket.attach(defiBasketAddress);

  // const EthBasket = await ethers.getContractFactory("EthBasket");
  // ethBasket = await DefiBasket.attach(ethBasketAddress);

  // const BasketLib = await ethers.getContractFactory("BasketLib");
  // basketLib = await BasketLib.attach(ethBasketLibAddress);

  // const GovAlpha = await ethers.getContractFactory("GovernorAlpha");
  // gov = await GovAlpha.attach(govAddress);

  // const Timelock = await ethers.getContractFactory("Timelock");
  // timelock = await Timelock.attach(timelockAddress);

}

async function deployKarteraToken(){

  //deploy kartera token
  const KarteraToken = await ethers.getContractFactory("KarteraToken");
  karteraToken = await KarteraToken.deploy();
  console.log('karteraToken contract id: ', karteraToken.address);
  console.log('transaction id: ', karteraToken.deployTransaction.hash);
  await karteraToken.deployed();
}

async function deployBasketLib(basketAddr:string, kpoAddr:string, govtokenaddr:string) {
  const BasketLib = await ethers.getContractFactory("BasketLib");
  basketLib = await BasketLib.deploy(basketAddr, kpoAddr, govtokenaddr);
  await basketLib.deployed();
  console.log('basketLib address: ', basketLib.address );
}

async function deployKarteraPriceOracle() {
  // const KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
  // karteraPriceOracle = await KarteraPriceOracle.deploy();
  // console.log('karteraPrice oracle address: ', karteraPriceOracle.address );
  // await karteraPriceOracle.deployed();

  let link = [etherCLAddr];
  // await karteraPriceOracle.addToken(constituentsRinkeby[0].addr, 1, link);
  // console.log('added token 1: ',  );

  // link = [constituentsRinkeby[1].claddr];
  // await karteraPriceOracle.addToken(constituentsRinkeby[1].addr, 1, link);
  // console.log('added token 2: ',  );

  link = [constituentsRinkeby[2].claddr];
  await karteraPriceOracle.addToken(constituentsRinkeby[2].addr, 1, link);
  console.log('added token 3: ',  );

  link = [constituentsRinkeby[3].claddr];
  await karteraPriceOracle.addToken(constituentsRinkeby[3].addr, 1, link);
  console.log('added token 4: ',  );

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
  'MockBtc',
  'MockLink',
  'MockSnx',
];
async function deployMockContracts() {

  for(let i=0; i<contractList.length; i++){
    let Token = await ethers.getContractFactory(contractList[i]);

    let token = await Token.deploy();

    console.log('karteraToken contract id: ', token.address);

    // console.log('transaction id: ', token.deployTransaction.hash);

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