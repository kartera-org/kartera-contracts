import { ethers } from 'hardhat';
import * as tokenABI from '../artifacts/contracts/mock/MockAave.sol/MockAave.json';
import { MockAave__factory, MockAave } from "../typechain";

const localContract = [
    {name:'MockAave', addr:'0x5FbDB2315678afecb367f032d93F642f64180aa3',},
    {name:'MockComp', addr:'0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',},
    {name:'MockMkr', addr:'0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',},
    {name:'MockSnx', addr:'0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',},
    {name:'MockSushi', addr:'0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',},
    {name:'MockUma', addr:'0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',},
    {name:'MockUni', addr:'0x0165878A594ca255338adfa4d48449f69242Eb8F',},
    {name:'MockYfi', addr:'0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',},
]

async function main() {
    let conIndx = 2;
    const [owner, addr] = await ethers.getSigners();
    const accounts = await ethers.provider.listAccounts();
    const Token = new ethers.Contract(localContract[conIndx].addr, tokenABI.abi, ethers.provider);
    let name = await Token.name();
    console.log('token name: ', name );
    let balance = await Token.balanceOf(accounts[0]);
    console.log('account balance: ', balance.toString() );

    // const CryptoTopTen = (await ethers.getContractFactory("MockAave")) as MockAave__factory;
    // const cryptoTopTen = await CryptoTopTen.attach(localContract[conIndx].addr);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });