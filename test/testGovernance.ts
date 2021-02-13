const { expectRevert, time } = require('@openzeppelin/test-helpers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { Timelock__factory, Timelock } from "../typechain";
import { GovernorAlpha__factory, GovernorAlpha } from "../typechain";
import { DefiBasket__factory, DefiBasket } from "../typechain";

import chai from "chai";
const { expect, assert } = chai;

function encodeParameters(types:any, values:any) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
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

describe('Governor', () => {

    before(async function () {
        // Get the ContractFactory and Signers here.
    
        [this.alice, this.bob, this.carol, ...this.others] = await ethers.getSigners();
        this.Kartera = await ethers.getContractFactory("KarteraToken");
        this.DefiBasket = await ethers.getContractFactory("DefiBasket");
        this.defiBasket = await this.DefiBasket.deploy();
        this.kartera = await this.Kartera.deploy();

        this.Timelock = await ethers.getContractFactory("Timelock");    
        this.GovernorAlpha = await ethers.getContractFactory("GovernorAlpha");  
        this.timelock = await this.Timelock.deploy(this.alice.address, time.duration.days(2).toString());
        this.gov = await this.GovernorAlpha.deploy(this.timelock.address, this.kartera.address, this.alice.address);
        await this.timelock.setPendingAdmin(this.gov.address);
        await this.gov.__acceptAdmin();  
        // Transfer ownership to timelock contract
        await this.defiBasket.transferOwnership(this.timelock.address);

        //deploy mock contracts
        this.MockAave = await ethers.getContractFactory('MockAave');
        this.mockAave = await this.MockAave.deploy();

        this.MockComp = await ethers.getContractFactory('MockComp');
        this.mockComp = await this.MockComp.deploy();

        this.MockMkr = await ethers.getContractFactory('MockMkr');
        this.mockMkr = await this.MockMkr.deploy();


      });

    it('should work', async function () {

        // Mint 100 tokens for bob.
        await this.kartera.mint(this.bob.address, '1000000');
        // Mint 10 tokens for carol.
        await this.kartera.mint(this.carol.address, '120000');

        assert.equal((await this.kartera.totalSupply()).toString(), '1120000');
        assert.equal((await this.kartera.balanceOf(this.bob.address)).toString(), '1000000');
        assert.equal((await this.kartera.balanceOf(this.carol.address)).toString(), '120000');

        await expectRevert(
            this.gov.connect(this.alice).propose(
                [this.kartera.address], ['0'], ['mint(address,uint256)'],
                [encodeParameters(['address', 'uint256'], [this.defiBasket.address, ethers.utils.parseEther('25000000')])],
                'Mint 25m more kartera tokens to defiBasket',
            ),
            'GovernorAlpha::propose: proposer votes below proposal threshold',
        );
        
        await this.kartera.connect(this.carol).delegate(this.carol.address);
        
        let tx = await this.gov.connect(this.carol).propose(
            [this.defiBasket.address], ['0'], ['addConstituent(address,uint8,uint8)'],
            [encodeParameters(['address','uint8', 'uint8'], [this.mockAave.address, 10, 5])],
            'Add new constituent to defibasket',
        );

        // await this.kartera.connect(this.bob).delegate(this.bob.address);


        // tx = await this.gov.connect(this.bob).propose(
        //     [this.kartera.address], ['0'], ['mint(address,uint256)'],
        //     [encodeParameters(['address','uint256'], [this.alice.address, ethers.utils.parseEther('25000000')])],
        //     'Mint 25m more kartera tokens to alice',
        // );


        // let proposal = await this.gov.getActions('2');

        // console.log('calldatas: ', proposal );

        // decode proposal call data
        // let info = ethers.utils.defaultAbiCoder.decode([ 'address', 'uint256' ], proposal.calldatas[0]);

        // console.log('proposal: ', info[1].toString() );
        // console.log('tx: ', tx );

        // let count = await this.gov.proposalCount();
        // console.log('count: ', count.toString() );

        // let info = ethers.utils.defaultAbiCoder.decode([ 'address[]', 'uint[]', 'string[]', 'bytes[]', 'string' ], ethers.utils.hexDataSlice(tx.data, 4));

        // console.log('info: ', info );
        
        // let abi = [
        // "event ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startBlock, uint endBlock, string description)"
        // ];

        // let iface = new ethers.utils.Interface(abi);

        // console.log('parsed date: ', iface.parseTransaction(proposalid.data) );

        // console.log('proposalid: ', proposalid.data.toString() );


        // console.log('kartera address: ', this.kartera.address );
        // let proposalinfo = await this.gov.getActions('1');
        // console.log('proposalinfo: ', proposalinfo[4].toString() );
        let state = await this.gov.state('1');
        console.log('proposal state: ', state );
        await time.advanceBlock();
        // state = await this.gov.state('1');
        // console.log('proposal state after block advance: ', state );
        await this.gov.connect(this.carol).castVote('1', true);
        let receipt = await this.gov.getReceipt('1', this.carol.address);
        console.log('voting receipt: ', receipt.toString() );
        state = await this.gov.state('1');
        console.log('proposal state after voting: ', state );
        await expectRevert(this.gov.queue('1'), "GovernorAlpha::queue: proposal can only be queued if it is succeeded");
        console.log("Advancing 17280 blocks. Will take a while... might have to increase mocha timeout");
        for (let i = 0; i < 100; ++i) {
            await time.advanceBlock();
        }
        state = await this.gov.state('1');
        console.log('proposal state after advancing 10 blocks: ', state );
        await this.gov.queue('1');

        // state = await this.gov.state('1');
        // console.log('proposal state after queue: ', state );

        await expectRevert(this.gov.execute('1'), "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        await time.increase(time.duration.days(3));

        // state = await this.gov.state('1');
        // console.log('proposal state after increase time duration: ', state );

        await this.gov.execute('1');

        state = await this.gov.state('1');
        console.log('proposal state after executing: ', state );

        assert.equal((await this.defiBasket.numberOfActiveConstituents()).toString(), 1);
        
    });
});
