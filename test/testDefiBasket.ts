import { solidity } from "ethereum-waffle";
const { expectRevert, time } = require('@openzeppelin/test-helpers');

import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert,  } = chai;

chai.use(solidity);
const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';

describe("DefiBasket functions", function () {
    before(async function () {
        [this.alice, this.bob, this.carol, ...this.addrs] = await ethers.getSigners();

        this.KarteraToken = (await ethers.getContractFactory("KarteraToken"));
        this.kartera = await this.KarteraToken.deploy();
        await this.kartera.deployed();

        this.KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
        this.karteraPriceOracle = await this.KarteraPriceOracle.deploy()
        await this.karteraPriceOracle.deployed();

        this.KarteraPriceOracle2 = await ethers.getContractFactory("KarteraPriceOracle2");
        this.karteraPriceOracle2 = await this.KarteraPriceOracle2.deploy()
        await this.karteraPriceOracle2.deployed();

        // Get the ContractFactory and Signers here.
        this.DefiBasket = await ethers.getContractFactory("DefiBasket");
        this.defiBasket = await this.DefiBasket.deploy();
        await this.defiBasket.deployed();

        this.BasketLib = await ethers.getContractFactory("BasketLib");
        this.basketLib = await this.BasketLib.deploy(this.defiBasket.address, this.karteraPriceOracle.address, this.kartera.address);
        await this.basketLib.deployed();
        await this.basketLib.transferManager(this.defiBasket.address);
        await this.defiBasket.setBasketLib(this.basketLib.address);
        // await this.defiBasket.setPriceOracleAddress(this.karteraPriceOracle.address);

        this.BasketLib2 = await ethers.getContractFactory("BasketLibV2");
        this.basketLib2 = await this.BasketLib2.deploy(this.defiBasket.address, this.karteraPriceOracle.address, this.kartera.address);
        await this.basketLib2.deployed();

        this.kartera.mint(this.defiBasket.address, ethers.utils.parseEther('1000000000'));

        this.MockAave = (await ethers.getContractFactory("MockAave"));
        this.mockAave = await this.MockAave.deploy();
        await this.mockAave.deployed();
        this.MockMkr = (await ethers.getContractFactory("MockMkr"));
        this.mockMkr = await this.MockMkr.deploy();
        await this.mockMkr.deployed();

        let link = ['0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockAave.address, 2, link);
        link = ['0x0B156192e04bAD92B6C1C13cf8739d14D78D5701', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockMkr.address, 2, link);

        // test new KPO2
        await this.karteraPriceOracle2.addToken(this.mockAave.address, 2, link);
        await this.karteraPriceOracle2.addToken(this.mockMkr.address, 2, link);
    });

    it("DefiBasket name check", async function () {
      const name = await this.defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");
    });

    it("Transfer owner and Add constituent check", async function () {

      await this.defiBasket.transferManager(this.bob.address)

      await this.defiBasket.connect(this.bob).addConstituent(this.mockAave.address, 50, 5);
      await this.defiBasket.connect(this.bob).addConstituent(this.mockMkr.address, 50, 5);
    });

    it("DefiBasket kartera balance check", async function () {

      let defiKarteraBal = await this.kartera.balanceOf(this.defiBasket.address);
      assert.equal(defiKarteraBal.toString(), ethers.utils.parseEther('1000000000'));
    });

    it('setting withdraw multiplier check', async function (){
      await this.defiBasket.setWithdrawIncentiveMultiplier(ethers.utils.parseEther('1'));
      expect( await this.defiBasket.withdrawIncentiveMultiplier()).to.equal(ethers.utils.parseEther('1'))
    })

    it('setting withdraw cost multiplier check', async function (){
      await this.defiBasket.setWithdrawCostMultiplier(ethers.utils.parseEther('1'));
      expect(await this.defiBasket.withdrawCostMultiplier()).to.equal(ethers.utils.parseEther('1'))
    })

    it("DefiBasket incentive token check", async function () {

      await this.defiBasket.setGovernanceToken(this.kartera.address, ethers.utils.parseEther('0.5'));

      expect(await this.defiBasket.depositIncentive('10')).to.equal(ethers.utils.parseEther('5'));
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
      let addr = await this.defiBasket.constituentAddress(0);
      let details = await this.defiBasket.getConstituentDetails(addr)
      expect(details[0].toString()).to.equal(this.mockAave.address);
    })

    it('change constituent weights', async function () {
      
      // change mockaave weight tol to 0
      await this.defiBasket.updateConstituent(this.mockAave.address, 20, 0);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
      await this.defiBasket.updateConstituent(this.mockAave.address, 20, 100);
      expect(await this.defiBasket.acceptingDeposit(this.mockAave.address)).to.equal(true);
    })

    it('set withdraw incentive check', async function () {
      await this.defiBasket.setWithdrawIncentiveMultiplier(ethers.utils.parseEther('10'));

      expect(await this.defiBasket.withdrawIncentive('1')).to.equal(ethers.utils.parseEther('10'));

      await this.defiBasket.removeConstituent(this.mockMkr.address);

      await this.defiBasket
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("100"));

      await this.defiBasket.withdrawInactive(this.mockMkr.address, ethers.utils.parseEther('100'));

      let mkrbal = await this.mockMkr.balanceOf(this.defiBasket.address);
      console.log('mkrbal: ', ethers.utils.formatUnits(mkrbal) );

      expect( await this.kartera.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('1100000'));
    });

    it('number of constituents check', async function () {
      expect( await this.defiBasket.numberOfActiveConstituents()).to.equal(1);
      await expectRevert(this.defiBasket.addConstituent(this.mockMkr.address, 20, 5), 'Constituent already exists')
      await this.defiBasket.activateConstituent(this.mockMkr.address);
      expect( await this.defiBasket.numberOfActiveConstituents()).to.equal(2);

    });

    it('check active constituent withdraw', async function () {

      await this.defiBasket.setWithdrawCostMultiplier(ethers.utils.parseEther('100'));

      // let withdrawcost = await this.defiBasket.constituentWithdrawCost(ethers.utils.parseEther('1'));

      // expect(withdrawcost).to.equal(ethers.utils.parseEther('10000'));

      let alicekartbal = await this.kartera.balanceOf(this.alice.address);
      console.log('alicekart : ', ethers.utils.formatUnits(alicekartbal) );

      let alicedefibal = await this.defiBasket.balanceOf(this.alice.address);
      console.log('alicedefibal : ', ethers.utils.formatUnits(alicedefibal) );

      let aliceMkrbal = await this.mockMkr.balanceOf(this.alice.address);
      console.log('aliceMkrbal : ', ethers.utils.formatUnits(aliceMkrbal) );

      let defiMkrBal = await this.mockMkr.balanceOf(this.defiBasket.address);
      console.log('defiMkrBal: ', ethers.utils.formatUnits(defiMkrBal) );

      await this.kartera.connect(this.alice).approve(this.defiBasket.address, ethers.utils.parseEther('10000'));

      await this.defiBasket.connect(this.alice).approve(this.defiBasket.address, ethers.utils.parseEther('1'));

      await this.defiBasket.withdrawActive(this.mockMkr.address, ethers.utils.parseEther('1'));
      alicekartbal = await this.kartera.balanceOf(this.alice.address);
      console.log('alicekart : ', ethers.utils.formatUnits(alicekartbal) );

      alicedefibal = await this.defiBasket.balanceOf(this.alice.address);
      console.log('alicedefibal : ', ethers.utils.formatUnits(alicedefibal) );

      aliceMkrbal = await this.mockMkr.balanceOf(this.alice.address);
      console.log('aliceMkrbal : ', ethers.utils.formatUnits(aliceMkrbal) );


    })

    it('governance token address check', async function () {
      expect(await this.defiBasket.governanceToken()).to.equal(this.kartera.address);
    })

    it('new price oracle check', async function (){

      let prc = await this.defiBasket.constituentPrice(this.mockAave.address);
      console.log('prc: ', prc.toString() );

      await this.defiBasket.setPriceOracle(this.karteraPriceOracle2.address);
      prc = await this.defiBasket.constituentPrice(this.mockAave.address);
      console.log('prc: ', prc.toString() );
    })  

    it('new basket check', async function (){
      await this.basketLib2.copyState(this.basketLib.address);
      let n = await this.basketLib2.numberOfActiveConstituents();
      console.log('n for basket 2: ', n );
      let aaveaddr = await this.basketLib2.constituentAddress(0);
      console.log('aaveaddr: ', aaveaddr );
      console.log('actual ave addre: ', this.mockAave.address );
    });

    it('pause defibasket check', async function () {
      await this.defiBasket.pause();
      await this.mockMkr
        .connect(this.alice)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1000000"));

        await  expectRevert( this.defiBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000000')), 'Contract is paused for upgrade');

        await this.defiBasket.unpause();

        let mockmkrbal = await this.mockMkr.balanceOf(this.defiBasket.address);
        console.log('mockmkrbal: ', ethers.utils.formatUnits(mockmkrbal) );

        await this.defiBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000'));

        mockmkrbal = await this.mockMkr.balanceOf(this.defiBasket.address);
        console.log('mockmkrbal after 1000 deposit: ', ethers.utils.formatUnits(mockmkrbal) );

    })
});