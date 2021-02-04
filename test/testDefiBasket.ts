import { solidity } from "ethereum-waffle";
import { DefiBasket__factory, DefiBasket } from "../typechain";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { MockAave__factory, MockAave } from "../typechain";

import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert } = chai;

chai.use(solidity);

describe("DefiBasket functions", function () {
    before(async function () {
        [this.alice, this.bob, this.carol, ...this.addrs] = await ethers.getSigners();

        // Get the ContractFactory and Signers here.
        this.DefiBasket = (await ethers.getContractFactory("DefiBasket")) as DefiBasket__factory;
        this.defiBasket = await this.DefiBasket.deploy();

        this.KarteraToken = (await ethers.getContractFactory("KarteraToken")) as KarteraToken__factory;
        this.kartera = await this.KarteraToken.deploy();
        this.kartera.mint(this.defiBasket.address, ethers.utils.parseEther('1000'));

        this.MockAave = (await ethers.getContractFactory("MockAave")) as MockAave__factory;
        this.mockAave = await this.MockAave.deploy();
    });

    it("DefiBasket name check", async function () {
      const name = await this.defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");

      await this.defiBasket.transferManager(this.bob.address)

      await this.defiBasket.connect(this.bob).addConstituent(this.mockAave.address, 20, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");

      let defiKarteraBal = await this.kartera.balanceOf(this.defiBasket.address);
      assert.equal(defiKarteraBal.toString(), ethers.utils.parseEther('1000'));

      await this.defiBasket.setIncentiveToken(this.kartera.address, ethers.utils.parseEther('0.5'));

      let incentive = await this.defiBasket.incentive('10');
      console.log('incentive: ', incentive.toString() );
    
      await this.mockAave
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("10"));

      await this.defiBasket.connect(this.alice).makeDeposit(this.mockAave.address, ethers.utils.parseEther('10'));

      let aliceKarteraBal = await this.kartera.balanceOf(this.alice.address);
      expect(aliceKarteraBal.toString()).to.equal(ethers.utils.parseEther('5'));


    });
});