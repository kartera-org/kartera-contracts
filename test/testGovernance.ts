const { expectRevert, time } = require('@openzeppelin/test-helpers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { Timelock__factory, Timelock } from "../typechain";
import { GovernorAlpha__factory, GovernorAlpha } from "../typechain";
import { DefiBasket__factory, DefiBasket } from "../typechain";

import chai from "chai";
const { expect, assert } = chai;

function tokens(n: string) {
    return ethers.utils.parseUnits(n, "ether");
  }

function encodeParameters(types:any, values:any) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

describe('Governor', () => {

    before(async function () {
        // Get the ContractFactory and Signers here.
    
        [this.alice, this.minter, this.dev, ...this.others] = await ethers.getSigners();
        this.Kartera = await ethers.getContractFactory("KarteraToken");
        this.DefiBasket = await ethers.getContractFactory("DefiBasket");
        this.Timelock = await ethers.getContractFactory("Timelock");    
        this.GovernorAlpha = await ethers.getContractFactory("GovernorAlpha");    
      });

    it('should work', async function () {

        this.defiBasket = await this.DefiBasket.deploy();

        this.kartera = await this.Kartera.deploy();

        await this.kartera.connect(this.dev).delegate(this.dev.address);
        // Mint 100 tokens for minter.
        await this.kartera.mint(this.minter.address, '100');
        // Mint 10 tokens for dev.
        await this.kartera.mint(this.dev.address, '10');

        assert.equal((await this.kartera.totalSupply()).toString(), '110');
        assert.equal((await this.kartera.balanceOf(this.minter.address)).toString(), '100');
        assert.equal((await this.kartera.balanceOf(this.dev.address)).toString(), '10');

        // Transfer ownership to timelock contract
        this.timelock = await this.Timelock.deploy(this.alice.address, time.duration.days(2).toString());
        this.gov = await this.GovernorAlpha.deploy(this.timelock.address, this.kartera.address, this.alice.address);
        await this.timelock.setPendingAdmin(this.gov.address);
        await this.gov.__acceptAdmin();

        let defiOwner = await this.defiBasket.owner();
        console.log('defiOwner: ', defiOwner );
        console.log('timelock: ', this.timelock.address );

        await this.defiBasket.transferOwnership(this.timelock.address);

        defiOwner = await this.defiBasket.owner();
        console.log('defiOwner after transter to timelock: ', defiOwner );

        await expectRevert(
            this.gov.connect(this.alice).propose(
                [this.defiBasket.address], ['0'], ['updateFeeFactor(uint256)'],
                [encodeParameters(['uint256'], ['2000'])],
                'Increase basket fees',
            ),
            'GovernorAlpha::propose: proposer votes below proposal threshold',
        );
        
        let proposalid = await this.gov.connect(this.dev).propose(
            [this.defiBasket.address], ['0'], ['updateFeeFactor(uint256)'],
            [encodeParameters(['uint256'], ['2000'])],
            'Increase basket fees',
        );
        console.log('proposal id: ', proposalid.value.toString() );

        await time.advanceBlock();
        await this.gov.connect(this.dev).castVote('1', true);
        // await expectRevert(this.gov.queue('1'), "GovernorAlpha::queue: proposal can only be queued if it is succeeded");
        console.log("Advancing 10 blocks. Will take a while...");
        // for (let i = 0; i < 10; ++i) {
        //     await time.advanceBlock();
        // }
        // console.log("Advancing all 10 blocks. done...");
        await this.gov.queue('1');
        await expectRevert(this.gov.execute('1'), "Timelock::executeTransaction: Transaction hasn't surpassed time lock.");
        await time.increase(time.duration.days(3));
        await this.gov.execute('1');
        assert.equal((await this.defiBasket.getFeeFactor()).toString(), '2000');
        
        await this.defiBasket.transferOwnership(this.alice.address);

        defiOwner = await this.defiBasket.owner();
        console.log('defiOwner at end: ', defiOwner );
    });
});
