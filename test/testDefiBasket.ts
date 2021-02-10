import { solidity } from "ethereum-waffle";
import { DefiBasket__factory, DefiBasket, MockAave } from "../typechain";
// import { KarteraToken__factory, KarteraToken } from "../typechain";
// import { MockAave__factory, MockAave } from "../typechain";

import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert } = chai;

chai.use(solidity);
const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';

describe("DefiBasket functions", function () {
    before(async function () {
        [this.alice, this.bob, this.carol, ...this.addrs] = await ethers.getSigners();

        this.KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
        this.karteraPriceOracle = await this.KarteraPriceOracle.deploy()

        // Get the ContractFactory and Signers here.
        this.DefiBasket = await ethers.getContractFactory("DefiBasket");
        this.defiBasket = await this.DefiBasket.deploy();
        await this.defiBasket.setPriceOracleAddress(this.karteraPriceOracle.address);

        this.KarteraToken = (await ethers.getContractFactory("KarteraToken"));
        this.kartera = await this.KarteraToken.deploy();
        this.kartera.mint(this.defiBasket.address, ethers.utils.parseEther('1000000000'));

        this.MockAave = (await ethers.getContractFactory("MockAave"));
        this.mockAave = await this.MockAave.deploy();
        this.MockMkr = (await ethers.getContractFactory("MockMkr"));
        this.mockMkr = await this.MockMkr.deploy();

        let link = ['0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockAave.address, 2, link);
        link = ['0x0B156192e04bAD92B6C1C13cf8739d14D78D5701', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockMkr.address, 2, link);
    });

    it("DefiBasket name check", async function () {
      const name = await this.defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");
    });

    it("Transfer owner and Add constituent check", async function () {

      await this.defiBasket.transferManager(this.bob.address)

      await this.defiBasket.connect(this.bob).addConstituent(this.mockAave.address, 20, 30);
      await this.defiBasket.connect(this.bob).addConstituent(this.mockMkr.address, 20, 30);
    });

    it("DefiBasket kartera balance check", async function () {

      let defiKarteraBal = await this.kartera.balanceOf(this.defiBasket.address);
      assert.equal(defiKarteraBal.toString(), ethers.utils.parseEther('1000000000'));
    });

    it("DefiBasket incentive token check", async function () {

      await this.defiBasket.setIncentiveToken(this.kartera.address, ethers.utils.parseEther('0.5'));

      expect(await this.defiBasket.incentive('10')).to.equal(ethers.utils.parseEther('5'));
    });

    it("DefiBasket make deposit check", async function () {
    
      await this.mockAave
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1000000"));

      await this.defiBasket.connect(this.alice).makeDeposit(this.mockAave.address, ethers.utils.parseEther('1000000'));

      expect(await this.mockAave.balanceOf(this.defiBasket.address)).to.equal(ethers.utils.parseEther('1000000'));
    });

    it("DefiBasket balance of Alice", async function () {

      expect( await this.defiBasket.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('10000'))

    })

    it("Kartera incentive balance of Alice", async function () {

      expect( await this.kartera.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('500000'))

    })
    
    it("DefiBasket make another deposit check", async function () {

      await this.mockMkr
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1000000"));

      await this.defiBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000000'));

      expect(await this.mockMkr.balanceOf(this.defiBasket.address)).to.equal(ethers.utils.parseEther('1000000'));
    });

    it("Kartera balance of Alice from incentive", async function () {
      let aliceKarteraBal = await this.kartera.balanceOf(this.alice.address);
      expect(aliceKarteraBal.toString()).to.equal(ethers.utils.parseEther('1000000'));
    });

    it('Total Deposit check', async function () {
      expect(await this.defiBasket.totalDeposit()).to.equal(ethers.utils.parseEther('2000000'));
    })

    it('get constituent details', async function (){
      let addr = await this.defiBasket.getConstituentAddress(0);
      let details = await this.defiBasket.getConstituentDetails(addr)
      expect(details[0].toString()).to.equal(this.mockAave.address);
    })

    it('change constituent weights', async function () {
      
      // change mockaave weight tol to 0
      // await this.defiBasket.updateConstituent(this.mockAave.address, 20, 0);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      await this.defiBasket.updateConstituent(this.mockAave.address, 20, 100);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(true);

    })

    it('set withdraw incentive check', async function () {
      await this.defiBasket.setWithdrawIncentiveToken(this.kartera.address, ethers.utils.parseEther('10'));

      expect(await this.defiBasket.withdrawIncentive('1')).to.equal(ethers.utils.parseEther('10'));

      await this.defiBasket.removeConstituent(this.mockMkr.address);

      await this.defiBasket
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("100"));

      await this.defiBasket.withdraw(this.mockMkr.address, ethers.utils.parseEther('100'));

      let mkrbal = await this.mockMkr.balanceOf(this.defiBasket.address);
      console.log('mkrbal: ', ethers.utils.formatUnits(mkrbal) );

      expect( await this.kartera.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('1100000'));
    });

});