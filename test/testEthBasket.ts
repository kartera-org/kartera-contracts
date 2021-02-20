import { solidity } from "ethereum-waffle";
const { expectRevert, time } = require('@openzeppelin/test-helpers');

import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert,  } = chai;

chai.use(solidity);
const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';

describe("EthBasket functions", function () {
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
        this.EthBasket = await ethers.getContractFactory("EthBasket");
        this.ethBasket = await this.EthBasket.deploy();
        await this.ethBasket.deployed();

        this.BasketLib = await ethers.getContractFactory("BasketLib");
        this.basketLib = await this.BasketLib.deploy(this.ethBasket.address, this.karteraPriceOracle.address, this.kartera.address);
        await this.basketLib.deployed();
        await this.basketLib.transferManager(this.ethBasket.address);
        await this.ethBasket.setBasketLib(this.basketLib.address);
        // await this.ethBasket.setPriceOracleAddress(this.karteraPriceOracle.address);

        this.BasketLib2 = await ethers.getContractFactory("BasketLibV2");
        this.basketLib2 = await this.BasketLib2.deploy(this.ethBasket.address, this.karteraPriceOracle.address, this.kartera.address);
        await this.basketLib2.deployed();

        await this.kartera.mint(this.ethBasket.address, ethers.utils.parseEther('10000000'));

        await this.kartera.mint(this.carol.address, ethers.utils.parseEther('20000'));

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
        this.addr0 = "0x0000000000000000000000000000000000000001";

        link = [etherCLAddr];
        await this.karteraPriceOracle.addToken(this.addr0, 1, link);
        
        await this.karteraPriceOracle2.addToken(this.addr0, 1, link);
        
        link = ['0x0B156192e04bAD92B6C1C13cf8739d14D78D5701', etherCLAddr];
        // test new KPO2
        await this.karteraPriceOracle2.addToken(this.mockAave.address, 2, link);
        await this.karteraPriceOracle2.addToken(this.mockMkr.address, 2, link);

        await this.ethBasket.updateDepositThreshold(ethers.utils.parseEther('100'));
    });

    it("EthBasket name check", async function () {
        const name = await this.ethBasket.name();
        expect(name).to.equal("Kartera ETH Basket");
    });

    it("Transfer owner and Add constituent check", async function () {

        await this.ethBasket.transferManager(this.bob.address)

        await this.ethBasket.connect(this.bob).addConstituent(this.addr0, 50, 5);
        await this.ethBasket.connect(this.bob).addConstituent(this.mockAave.address, 35, 5);
        await this.ethBasket.connect(this.bob).addConstituent(this.mockMkr.address, 15, 5);
    });

    it("EthBasket kartera balance check", async function () {

        let ethBasketKarteraBal = await this.kartera.balanceOf(this.ethBasket.address);
        assert.equal(ethBasketKarteraBal.toString(), ethers.utils.parseEther('10000000'));
    });

    it('setting withdraw multiplier check', async function (){
        await this.ethBasket.setWithdrawIncentiveMultiplier(ethers.utils.parseEther('1'));
        expect( await this.ethBasket.withdrawIncentiveMultiplier()).to.equal(ethers.utils.parseEther('1'))
    })

    it('setting withdraw cost multiplier check', async function (){
        await this.ethBasket.setWithdrawCostMultiplier(ethers.utils.parseEther('1'));
        expect(await this.ethBasket.withdrawCostMultiplier()).to.equal(ethers.utils.parseEther('1'))
    })

    it("EthBasket incentive token check", async function () {

        await this.ethBasket.setGovernanceToken(this.kartera.address, ethers.utils.parseEther('0.5'));

        expect(await this.ethBasket.depositIncentive('10', this.mockAave.address)).to.equal(ethers.utils.parseEther('5'));
    });

    it("EthBasket make deposit check", async function () {
    
        await this.mockAave
        .connect(this.alice)
        .approve(this.ethBasket.address, ethers.utils.parseEther("100"));

        await expectRevert(this.ethBasket.connect(this.alice).makeDeposit(this.mockAave.address, ethers.utils.parseEther('100')), 'Contract is paused');

        await this.ethBasket.unpause();

        await this.ethBasket.connect(this.alice).makeDeposit(this.mockAave.address, ethers.utils.parseEther('100'));

        expect(await this.mockAave.balanceOf(this.ethBasket.address)).to.equal(ethers.utils.parseEther('100'));
    });

    it("EthBasket balance of Alice", async function () {

        expect( await this.ethBasket.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('1'))

    })

    it("Kartera incentive balance of Alice", async function () {

        expect( await this.kartera.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('50'))

    })
    
    it("EthBasket make ETHER deposit check", async function () {

        await this.ethBasket.connect(this.alice).makeDeposit(this.addr0, ethers.utils.parseEther('100'), {value: ethers.utils.parseEther('100')});

        expect(await ethers.provider.getBalance(this.ethBasket.address)).to.equal(ethers.utils.parseEther('100'));

        expect(await this.ethBasket.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('2'));

    });

    it("Kartera balance of Alice from incentive", async function () {
        let aliceKarteraBal = await this.kartera.balanceOf(this.alice.address);
        expect(aliceKarteraBal.toString()).to.equal(ethers.utils.parseEther('100'));
    });

    it('Total Deposit check', async function () {
        expect(await this.ethBasket.totalDeposit()).to.equal(ethers.utils.parseEther('200'));
    })

    it('get constituent details', async function (){
        let addr = await this.ethBasket.constituentAddress(0);
        let details = await this.ethBasket.getConstituentDetails(addr)
        expect(details[0].toString()).to.equal(this.addr0);
    })

    it('change constituent weights', async function () {
        
        // change mockaave weight tol to 0
        await this.ethBasket.updateConstituent(this.mockAave.address, 1, 0);
        expect(await this.ethBasket.acceptingDeposit(this.mockAave.address)).to.equal(false);
        await this.ethBasket.updateConstituent(this.mockAave.address, 20, 100);
        expect(await this.ethBasket.acceptingDeposit(this.mockAave.address)).to.equal(true);
    })

    /////////////////////////////// working above ///////////////////////////////

    it('set withdraw incentive check', async function () {
        await this.ethBasket.setWithdrawIncentiveMultiplier(ethers.utils.parseEther('10'));

        expect(await this.ethBasket.withdrawIncentive('1', this.mockAave.address)).to.equal(ethers.utils.parseEther('10'));

        await this.ethBasket.removeConstituent(this.addr0);

        let ethbal = await ethers.provider.getBalance(this.ethBasket.address);
        console.log('ethbal of basket: ', ethers.utils.formatUnits(ethbal) );

        let aliceethBasketbal = await this.ethBasket.balanceOf(this.alice.address);
        console.log('alice ethBasket bal before withdraw: ', ethers.utils.formatUnits(aliceethBasketbal) );

        let aliceethbal = await ethers.provider.getBalance(this.alice.address);
        console.log('alice Ether bal before withdraw: ', ethers.utils.formatUnits(aliceethbal) );

        await this.ethBasket.withdrawInactive(this.addr0, ethers.utils.parseEther('1'));

        aliceethbal = await ethers.provider.getBalance(this.alice.address);
        console.log('alice Ether bal after withdraw: ', ethers.utils.formatUnits(aliceethbal) );

        aliceethBasketbal = await this.ethBasket.balanceOf(this.alice.address);
        console.log('alice ethBasket bal after withdraw: ', ethers.utils.formatUnits(aliceethBasketbal) );

        ethbal = await ethers.provider.getBalance(this.ethBasket.address);
        console.log('ethbal of basket: ', ethers.utils.formatUnits(ethbal) );

        expect( await this.kartera.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('1100'));
    });

    it('number of constituents check', async function () {
        expect( await this.ethBasket.numberOfActiveConstituents()).to.equal(2);
        await expectRevert(this.ethBasket.addConstituent(this.mockMkr.address, 20, 5), 'Constituent already exists')
        await this.ethBasket.activateConstituent(this.addr0);
        expect( await this.ethBasket.numberOfActiveConstituents()).to.equal(3);

    });

    it('check active constituent withdraw for non basket holder', async function () {

        await this.ethBasket.setWithdrawCostMultiplier(ethers.utils.parseEther('100'));

        let carolkartbal = await this.kartera.balanceOf(this.carol.address);
        console.log('carolkart : ', ethers.utils.formatUnits(carolkartbal) );

        let carolethBasketbal = await this.ethBasket.balanceOf(this.carol.address);
        console.log('carolethBasketbal : ', ethers.utils.formatUnits(carolethBasketbal) );

        let carolAavebal = await this.mockAave.balanceOf(this.carol.address);
        console.log('carolAavebal : ', ethers.utils.formatUnits(carolAavebal) );

        let ethBasketAaveBal = await this.mockAave.balanceOf(this.ethBasket.address);
        console.log('ethBasketAaveBal: ', ethers.utils.formatUnits(ethBasketAaveBal) );

        await this.kartera.connect(this.carol).approve(this.ethBasket.address, ethers.utils.parseEther('10000'));

        await expectRevert(this.ethBasket.connect(this.carol).withdrawActive(this.mockAave.address, ethers.utils.parseEther('1')), 'burn amount exceeds balance');
        
    })

    it('check withdraw active constituent', async function() {

        let ethBasketAaveBal = await this.mockAave.balanceOf(this.ethBasket.address);
        console.log('ethBasketAaveBal: ',  ethers.utils.formatUnits(ethBasketAaveBal));

        let aliceAaveBal = await this.mockAave.balanceOf(this.alice.address);
        console.log('aliceAaveBal: ',  ethers.utils.formatUnits(aliceAaveBal));

        await this.kartera.mint(this.alice.address, ethers.utils.parseEther('10000'));
        let aliceKartBal = await this.kartera.balanceOf(this.alice.address);
        console.log('aliceKartBal: ',  ethers.utils.formatUnits(aliceKartBal));


        await this.kartera.connect(this.alice).approve(this.ethBasket.address, ethers.utils.parseEther('10000'));

        await this.ethBasket.connect(this.alice).withdrawActive(this.mockAave.address, ethers.utils.parseEther('1'));

        aliceAaveBal = await this.mockAave.balanceOf(this.alice.address);
        console.log('aliceAaveBal after withdraw: ',  ethers.utils.formatUnits(aliceAaveBal));

        ethBasketAaveBal = await this.mockAave.balanceOf(this.ethBasket.address);
        console.log('ethBasketAaveBal after withdraw: ',  ethers.utils.formatUnits(ethBasketAaveBal));
    })

    it('check balance after withdraw revert from no approval', async function () {
        let carolkartbal = await this.kartera.balanceOf(this.carol.address);
        console.log('carolkart : ', ethers.utils.formatUnits(carolkartbal) );

        let carolethBasketbal = await this.ethBasket.balanceOf(this.carol.address);
        console.log('carolethBasketbal : ', ethers.utils.formatUnits(carolethBasketbal) );

        let aliceMkrbal = await this.mockMkr.balanceOf(this.carol.address);
        console.log('aliceMkrbal : ', ethers.utils.formatUnits(aliceMkrbal) );

        let ethBasketMkrBal = await this.mockMkr.balanceOf(this.ethBasket.address);
        console.log('ethBasketMkrBal: ', ethers.utils.formatUnits(ethBasketMkrBal) );
    })

    it('governance token address check', async function () {
        expect(await this.ethBasket.governanceToken()).to.equal(this.kartera.address);
    })

    it('new price oracle check', async function (){

        let prc = await this.ethBasket.constituentPrice(this.mockAave.address);
        console.log('prc: ', prc.toString() );

        await this.ethBasket.setPriceOracle(this.karteraPriceOracle2.address);
        prc = await this.ethBasket.constituentPrice(this.mockAave.address);
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

    it('should fail to change basket address', async function () {
        await expectRevert(this.ethBasket.setBasketLib(this.basketLib2.address), 'Contract is not paused');
    })

    it('pause ethBasketbasket check', async function () {
        await this.ethBasket.pause();

        await this.ethBasket.setBasketLib(this.basketLib2.address);

        await this.basketLib2.transferManager(this.ethBasket.address);

        await this.mockMkr
        .connect(this.alice)
        .approve(this.ethBasket.address, ethers.utils.parseEther("1000000"));

        await  expectRevert( this.ethBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000000')), 'Contract is paused');

        await this.ethBasket.unpause();

        let mockmkrbal = await this.mockMkr.balanceOf(this.ethBasket.address);
        console.log('mockmkrbal: ', ethers.utils.formatUnits(mockmkrbal) );

        await this.ethBasket.connect(this.alice).makeDeposit(this.mockMkr.address, ethers.utils.parseEther('1000'));

        mockmkrbal = await this.mockMkr.balanceOf(this.ethBasket.address);
        console.log('mockmkrbal after 1000 deposit: ', ethers.utils.formatUnits(mockmkrbal) );
    })

    it('updateDepositThreshold check', async function (){
        let depositTh = await this.ethBasket.depositThreshold();
        console.log('deposit th : ', ethers.utils.formatUnits(depositTh) );
        await this.ethBasket.updateDepositThreshold(ethers.utils.parseEther('1000'));

        depositTh = await this.ethBasket.depositThreshold();
        console.log('deposit th : ', ethers.utils.formatUnits(depositTh) );

    })
});




// let ethbal = await this.alice.getBalance();
// console.log('eth bal: ', ethers.utils.formatUnits(ethbal) );

// const tx = {
// to: this.bob.address,
// value: ethers.utils.parseEther('100'),
// };

// await this.alice.sendTransaction(tx);
// ethbal = await this.alice.getBalance();
// console.log('eth bal: ', ethers.utils.formatUnits(ethbal) );

// ethbal = await this.bob.getBalance();
// console.log('eth bal: ', ethers.utils.formatUnits(ethbal) );