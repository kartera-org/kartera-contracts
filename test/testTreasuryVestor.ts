import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { TreasuryVestor__factory, TreasuryVestor } from "../typechain";
import chai from "chai";
const { expect, assert } = chai;
const { expectRevert, time } = require( "@openzeppelin/test-helpers");

describe ( 'Treasury Vestor' , () => {

    before( async function () {
        [this.alice, this.bob, this.carol, ...this.others] = await ethers.getSigners();
        this.KarteraToken = await ethers.getContractFactory("KarteraToken");    
        this.TreasuryVestor = await ethers.getContractFactory("TreasuryVestor");
    })

    beforeEach( async function () {
        this.kartera = await this.KarteraToken.deploy();
        await this.kartera.connect(this.alice).mint(this.alice.address, ethers.utils.parseEther('300000000'));

        let startV = await time.latest();
        //add ten seconds
        startV = parseInt(startV) + 10;
        let cliffV = startV + 10;
        let endV = startV + 20;
        this.treasuryVestor = await this.TreasuryVester.deploy(this.kartera.address, this.bob.address, ethers.utils.parseEther('300000000'), startV.toString(), cliffV.toString(), endV.toString()  );
        // // fund teasury vestor with 300000000 tokens
        await this.kartera.connect(this.alice).transfer(this.treasuryVestor.address, ethers.utils.parseEther('300000000'));
    })

    it('Treasury Vesting has correct vesting', async function () {
        let balAlice = await this.kartera.balanceOf(this.alice.address);
        assert.equal(balAlice.toString(), ethers.utils.parseEther('0') );

        let treasurybal = await this.kartera.balanceOf(this.treasuryVestor.address);
        assert.equal(treasurybal.toString(), ethers.utils.parseEther('300000000'));

        await expect( this.treasuryVestor.setRecipient(this.carol.address)).to.be.revertedWith("TreasuryVester::setRecipient: unauthorized");

        await expect ( this.treasuryVestor.connect(this.bob).claim() ).to.be.revertedWith('TreasuryVester::claim: not time yet');

        let tm = await time.latest();
        console.log('tm: ', tm.toString() );
        await time.increase(time.duration.seconds(20))

        

        await this.treasuryVestor.connect(this.bob).claim();
        let bobBal = await this.kartera.balanceOf(this.bob.address);
        console.log('bob bal: ', bobBal.toString() );

    });
});