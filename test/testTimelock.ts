const { expectRevert, time } = require('@openzeppelin/test-helpers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { Timelock__factory, Timelock } from "../typechain";

import chai from "chai";
const { expect, assert } = chai;

function encodeParameters(types:any, values:any) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

describe('Timelock', () => {

    before(async function () {
        // Get the ContractFactory and Signers here.
    
        [this.alice, this.bob, this.carol, ...this.others] = await ethers.getSigners();
        this.KarteraToken = await ethers.getContractFactory("KarteraToken");    
        this.Timelock = await ethers.getContractFactory("Timelock");    
      });

    beforeEach(async function () {
        this.kartera = await this.KarteraToken.deploy();
        this.timelock = await this.Timelock.deploy(this.bob.address, '259200');

        await this.kartera.transferOwnership(this.timelock.address);

    });

    it('should not allow non-owner to transfer', async function () {
        await expect(
            this.kartera.connect(this.bob).transferOwnership( this.carol.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not allow non-admin to do operation', async function () {
        await expect(
            this.timelock.queueTransaction(
                this.kartera.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [this.carol.address]),
                (await time.latest()).add(time.duration.days(4)).toString(),
            )
        ).to.be.revertedWith('Timelock::queueTransaction: Call must come from admin.');
    });
    

    it('should do the timelock', async function() {
        const eta = (await time.latest()).add(time.duration.days(4)).toString();
        await this.timelock.connect(this.bob).queueTransaction(
            this.kartera.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [this.carol.address]), eta,
        );
        await time.increase(time.duration.days(1));
        await expectRevert(
            this.timelock.connect(this.bob).executeTransaction(
                this.kartera.address, '0', 'transferOwnership(address)',
                encodeParameters(['address'], [this.carol.address]), eta,
            ),
            "Timelock::executeTransaction: Transaction hasn't surpassed time lock.",
        );
        await time.increase(time.duration.days(4));
        await this.timelock.connect(this.bob).executeTransaction(
            this.kartera.address, '0', 'transferOwnership(address)',
            encodeParameters(['address'], [this.carol.address]), eta,
        );
        assert.equal((await this.kartera.owner()).valueOf(), this.carol.address);
    });
});
