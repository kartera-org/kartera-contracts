import { solidity } from "ethereum-waffle";
import { DefiBasket__factory, DefiBasket, MockAave } from "../typechain";
// import { KarteraToken__factory, KarteraToken } from "../typechain";
// import { MockAave__factory, MockAave } from "../typechain";

import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert } = chai;

chai.use(solidity);

describe("DefiBasket functions", function () {
    before(async function () {
        [this.alice, this.bob, this.carol, ...this.addrs] = await ethers.getSigners();

        // Get the ContractFactory and Signers here.
        this.DefiBasket = (await ethers.getContractFactory("DefiBasket"));
        this.defiBasket = await this.DefiBasket.deploy();

        this.KarteraToken = (await ethers.getContractFactory("KarteraToken"));
        this.kartera = await this.KarteraToken.deploy();
        this.kartera.mint(this.defiBasket.address, ethers.utils.parseEther('1000000000'));

        this.MockAave = (await ethers.getContractFactory("MockAave"));
        this.mockAave = await this.MockAave.deploy();
        this.MockMkr = (await ethers.getContractFactory("MockMkr"));
        this.mockMkr = await this.MockMkr.deploy();
    });

    it("DefiBasket name check", async function () {
      const name = await this.defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");

      await this.defiBasket.transferManager(this.bob.address)

      await this.defiBasket.connect(this.bob).addConstituent(this.mockAave.address, 20, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await this.defiBasket.connect(this.bob).addConstituent(this.mockMkr.address, 20, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");

      let defiKarteraBal = await this.kartera.balanceOf(this.defiBasket.address);
      assert.equal(defiKarteraBal.toString(), ethers.utils.parseEther('1000000000'));

      await this.defiBasket.setIncentiveToken(this.kartera.address, ethers.utils.parseEther('0.5'));

      let incentive = await this.defiBasket.incentive('10');
      console.log('incentive: ', incentive.toString() );
    
      await this.mockAave
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1000000"));

      await this.defiBasket.connect(this.alice).makeDeposit(this.mockAave.address, ethers.utils.parseEther('1000000'));

      await this.mockMkr
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1000000"));

      await this.defiBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000000'));

      let aliceKarteraBal = await this.kartera.balanceOf(this.alice.address);
      console.log('alice kartera bal: ', aliceKarteraBal.toString() );
      expect(aliceKarteraBal.toString()).to.equal(ethers.utils.parseEther('1000000'));


    });

    it('change constituent weights', async function () {
      
      // change mockaave weight tol to 0
      // await this.defiBasket.updateConstituent(this.mockAave.address, 20, 0);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      // await this.defiBasket.updateConstituent(this.mockAave.address, 20, 20);
      // expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      // await this.defiBasket.updateConstituent(this.mockAave.address, 20, 30);
      // expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      await this.defiBasket.updateConstituent(this.mockAave.address, 20, 31);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      // await this.defiBasket.updateConstituent(this.mockAave.address, 20, 35);
      // expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);

      let totaldeposit = await this.defiBasket.totalDeposit();
      console.log('totaldeposit: ', totaldeposit.toString() );


    })

});