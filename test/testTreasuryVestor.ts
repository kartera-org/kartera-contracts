import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { TreasuryVester__factory, TreasuryVester } from "../typechain";
import chai from "chai";
const { expect, assert } = chai;
const { expectRevert, time } = require( "@openzeppelin/test-helpers");

function tokens(n: string) {
    return ethers.utils.parseUnits(n, "ether");
  }

describe ( 'Treasury Vestor' , () => {

    before( async function () {
        [this.alice, this.bob, this.carol, ...this.others] = await ethers.getSigners();
        this.KarteraToken = await ethers.getContractFactory("KarteraToken");    
        this.TreasuryVester = await ethers.getContractFactory("TreasuryVester");
    })

    beforeEach( async function () {
        this.kartera = await this.KarteraToken.deploy();
        await this.kartera.connect(this.alice).mint(this.alice.address, tokens('300000000'));

        let startV = await time.latest();
        //add ten seconds
        startV = parseInt(startV) + 10;
        let cliffV = startV + 10;
        let endV = startV + 20;
        this.treasuryVester = await this.TreasuryVester.deploy(this.kartera.address, this.bob.address, tokens('300000000'), startV.toString(), cliffV.toString(), endV.toString()  );
        // // fund teasury vestor with 300000000 tokens
        await this.kartera.connect(this.alice).transfer(this.treasuryVester.address, tokens('300000000'));
    })

    it('Treasury Vesting has correct vesting', async function () {
        let balAlice = await this.kartera.balanceOf(this.alice.address);
        assert.equal(balAlice.toString(), tokens('0') );

        let treasurybal = await this.kartera.balanceOf(this.treasuryVester.address);
        assert.equal(treasurybal.toString(), tokens('300000000'));

        await expect( this.treasuryVester.setRecipient(this.carol.address)).to.be.revertedWith("TreasuryVester::setRecipient: unauthorized");

        await expect ( this.treasuryVester.connect(this.bob).claim() ).to.be.revertedWith('TreasuryVester::claim: not time yet');

        let tm = await time.latest();
        console.log('tm: ', tm.toString() );
        await time.increase(time.duration.seconds(20))

        

        await this.treasuryVester.connect(this.bob).claim();
        let bobBal = await this.kartera.balanceOf(this.bob.address);
        console.log('bob bal: ', bobBal.toString() );

    });
});