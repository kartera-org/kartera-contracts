import { ethers } from "hardhat";

async function main() {

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

    const kovanContracts = [
        {name:'MockAave', addr:'0xefF313696D5513Ab2d7763a967a64d26B0fBB793'},
        {name:'MockComp', addr:'0x1D8F91800fB64A5cB61bF017787dD1B72be8C70F'},
        {name:'MockMkr', addr:'0x93a1d61641750DcA1826DeD628c82188C928307E'},
        {name:'MockSnx', addr:'0xbB4B258B362C7d9d07903E8934b45550a4A7F92C'},
        {name:'MockSushi', addr:'0x40717C1049Be241C9fD431Cd1EDE91c2AbFdA218'},
        {name:'MockUma', addr:'0x07e58CC9fec4AA73B6B39978A1df2EFB94EbDB2a'},
        {name:'MockUni', addr:'0x32Bd516d7C5cdD918477632558C01aF2663f3F69'},
        {name:'MockYfi', addr:'0xd9D54E7016306A3009629833C2409Fd04F25A118'},
    ]

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
