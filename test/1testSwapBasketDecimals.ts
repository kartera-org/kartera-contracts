import { solidity } from "ethereum-waffle";
const { expectRevert, time } = require('@openzeppelin/test-helpers');
import { ethers } from "hardhat";
import chai from "chai";
import { KarteraFarm } from "../typechain";
const { expect, assert,  } = chai;

chai.use(solidity);
const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';

describe("Swap Basket functions", function () {
    before(async function () {

        [this.alice, this.bob, this.carol, ...this.addrs] = await ethers.getSigners();

        this.KarteraToken = await ethers.getContractFactory("KarteraToken");
        this.karteraToken = await this.KarteraToken.deploy();
        console.log('kartera token address: ', this.karteraToken.address );
        await this.karteraToken.deployed();

        await this.karteraToken.mint(this.alice.address, ethers.utils.parseEther('1000'));

        this.KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracleMock");
        this.karteraPriceOracle = await this.KarteraPriceOracle.deploy();
        console.log('KarteraPriceOracle address: ', this.karteraPriceOracle.address );
        await this.karteraPriceOracle.deployed();

        this.SwapBasket = await ethers.getContractFactory("SwapBasket");
        this.basket = await this.SwapBasket.deploy(this.karteraToken.address);
        console.log('basket address: ', this.basket.address );
        await this.basket.deployed();

        this.SwapLib = await ethers.getContractFactory("SwapLib");
        this.swaplib = await this.SwapLib.deploy(this.basket.address, this.karteraPriceOracle.address);
        console.log('swaplib address: ', this.swaplib.address );
        await this.swaplib.deployed();

        this.basket.setSwapLib(this.swaplib.address)

        this.MockAave = await ethers.getContractFactory("MockAave");
        this.mockAave = await this.MockAave.deploy();
        console.log('MockAave address: ', this.mockAave.address );
        await this.mockAave.deployed();
        this.MockMkr = await ethers.getContractFactory("MockMkr");
        this.mockMkr = await this.MockMkr.deploy();
        console.log('mockMkr address: ', this.mockMkr.address );
        await this.mockMkr.deployed();

        this.MockWbtc = await ethers.getContractFactory("MockWbtc");
        this.mockWbtc = await this.MockWbtc.deploy();
        console.log('mockMkr address: ', this.mockWbtc.address );
        await this.mockWbtc.deployed();

        let link = ['0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockAave.address, 2, link);
        link = ['0x0B156192e04bAD92B6C1C13cf8739d14D78D5701', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockMkr.address, 2, link);
        await this.karteraPriceOracle.addToken(this.mockWbtc.address, 2, link);
        this.addr0 = "0x0000000000000000000000000000000000000001";
        link = [etherCLAddr];
        await this.karteraPriceOracle.addToken(this.addr0, 1, link);

        ////////////////// deploy swap farm and library /////////////////

        this.SwapFarm = await ethers.getContractFactory("SwapFarm");
        this.swapFarm = await this.SwapFarm.deploy(this.karteraToken.address);
        console.log('swap farm address: ', this.swapFarm.address );
        await this.swapFarm.deployed();

        this.SwapFarmLib = await ethers.getContractFactory("SwapFarmLib");
        this.startblock = await ethers.provider.getBlockNumber();
        this.startblock += 2;
        this.endbonusofferblock = this.startblock + 31;
        let rewardsperblock = ethers.utils.parseEther('100');
        this.swapFarmLib = await this.SwapFarmLib.deploy(this.swapFarm.address, rewardsperblock, this.startblock, this.endbonusofferblock);
        console.log('swap farm lib address: ', this.swapFarmLib.address );
        await this.swapFarmLib.deployed();

        await this.swapFarm.setSwapFarmLib(this.swapFarmLib.address);

        //make swap farm owner of kartera token
        await this.karteraToken.transferOwnership(this.swapFarm.address);

        let allocation = '100';
        await this.swapFarm.addBasket(this.basket.address, allocation);

        let numberOfBasketsInFarm = await this.swapFarmLib.numberOfBaskets();
        console.log('numberOfBasketsInFarm: ', numberOfBasketsInFarm.toString() );
        let basketAddr = await this.swapFarmLib.basketAddress(0);
        console.log('basketAddr: ', basketAddr.toString() );

        // set swap farm to basket
        await this.basket.setSwapFarmAddress(this.swapFarm.address);

        // deploy Kart Farm contract
        this.KartFarm = await ethers.getContractFactory("KarteraFarm");
        this.kartFarm = await this.KartFarm.deploy(this.karteraToken.address, this.karteraPriceOracle.address);
        await this.kartFarm.addBasket(this.basket.address);
        // set kartFarm address to basket
        await this.basket.setKartFarmAddress(this.kartFarm.address);

    });

    it('basket state paused/unpaused', async function() {
        expect(await this.basket.pause_()).to.equal(true);
        await this.basket.unpause();
        expect(await this.basket.pause_()).to.equal(false);
        let numberOfBlocks = 10;
        // for(let i=0; i<numberOfBlocks; i++){
        //     await time.advanceBlock();
        // }
    })

    it('check basket lib manager', async function() {
        expect( await this.swaplib.manager()).to.equal(this.basket.address);
    })

    it('add constituents to basket and check number', async function () {
        let addr ="0x0000000000000000000000000000000000000001";
        await this.basket.addConstituent(addr);
        await this.basket.addConstituent(this.mockAave.address);
        await this.basket.addConstituent(this.mockMkr.address);
        await this.basket.addConstituent(this.mockWbtc.address);
        expect(await this.basket.numberOfActiveConstituents()).to.equal(4);
        expect(await this.basket.numberOfConstituents()).to.equal(4);
    })

    it('check decimals of mockWbtc', async function () {
        expect (await this.mockWbtc.decimals()).to.equal(8);
    })

    it('check wbtc basket exRate to equal 100-1', async function(){
        let exrate = await this.basket.exchangeRate(this.mockWbtc.address);
        let zz = ethers.utils.parseUnits('1', 8) ;
        console.log('exrate: ', zz.toString());
    })

    it('deposit 100 wbtc in basket', async function(){
        this.decs = await this.mockWbtc.decimals();
        await this.mockWbtc.approve(this.basket.address, ethers.utils.parseUnits('10000', this.decs));
        await this.basket.addLiquidity(this.mockWbtc.address, ethers.utils.parseUnits('10000', this.decs));
    });

    it('expect basket price=100', async function () {
        let basketprc = await this.basket.basketTokenPrice();
        expect(basketprc).to.equal(ethers.utils.parseEther('100'));
    })
    it('expect balance of wbtc in basket=100', async function(){
        let basketBal_wbtc = await this.mockWbtc.balanceOf(this.basket.address);
        expect(basketBal_wbtc).to.equal(ethers.utils.parseUnits('10000', this.decs));
    });
    it('expect bal of basket in alice account=1', async function(){
        let alice_basket_bal = await this.basket.balanceOf(this.alice.address);
        console.log('alice_basket_bal: ', alice_basket_bal.toString() );
        expect(alice_basket_bal).to.equal(ethers.utils.parseUnits('100', 18))
    })

    it('deposit 10000 aave in basket', async function(){
        this.decs = await this.mockAave.decimals();
        await this.mockAave.approve(this.basket.address, ethers.utils.parseUnits('10000', this.decs));
        await this.basket.addLiquidity(this.mockAave.address, ethers.utils.parseUnits('10000', this.decs));
    });

    it('expect basket price=100', async function () {
        let basketprc = await this.basket.basketTokenPrice();
        expect(basketprc).to.equal(ethers.utils.parseEther('100'));
    })

    it('check getSwapFee function', async function () {
        for(let i=0; i<10; i++){
            let amount = i*100;
            let fee = await this.swaplib.getSwapFee(this.mockWbtc.address, ethers.utils.parseUnits(amount.toString(), 8));
            let expFee = 30*(i+1);
            expect(fee).to.equal(expFee)
        }
    })

    it('withdraw WBTC liq', async function () {
        let cost = this.basket.withdrawCost(ethers.utils.parseEther('1'))
        await this.karteraToken.approve(this.basket.address, cost);
        await this.basket.withdrawLiquidity(this.mockWbtc.address, ethers.utils.parseEther('1'));

        let wbtcBal = await this.mockWbtc.balanceOf(this.basket.address);
        expect(wbtcBal).to.equal(ethers.utils.parseUnits('9900', 8));
    })

    it('expect basket price=100', async function () {
        let basketprc = await this.basket.basketTokenPrice();
        expect(basketprc).to.equal(ethers.utils.parseEther('100'));
    })


    it('unpause trading', async function () {
        await this.basket.unpauseTrading();
    })

    it('swap aave for wbtc', async function () {
        await this.mockAave.approve(this.basket.address, ethers.utils.parseEther('1'));
        await this.basket.swap(this.mockAave.address, this.mockWbtc.address, ethers.utils.parseEther('1'))
        let wbtcBal = await this.mockWbtc.balanceOf(this.basket.address);
        expect(wbtcBal).to.equal(ethers.utils.parseUnits('9899.003', 8));

        let aavebal = await this.mockAave.balanceOf(this.basket.address);
        expect(aavebal).to.equal(ethers.utils.parseUnits('10001', 18));
    })

    it('check basket balance in kartFarm after swap', async function () {
        let basketbal_inKartFarm = await this.basket.balanceOf(this.kartFarm.address);
        expect(basketbal_inKartFarm).to.equal(ethers.utils.parseEther('0.000005'));
    })

    it('swap wbtc for aave', async function () {
        await this.mockWbtc.approve(this.basket.address, ethers.utils.parseUnits('1', 8));
        await this.basket.swap(this.mockWbtc.address, this.mockAave.address, ethers.utils.parseUnits('1', 8))
        let wbtcBal = await this.mockWbtc.balanceOf(this.basket.address);
        expect(wbtcBal).to.equal(ethers.utils.parseUnits('9900.003', 8));

        let aavebal = await this.mockAave.balanceOf(this.basket.address);
        expect(aavebal).to.equal(ethers.utils.parseUnits('10000.003', 18));
    })

    it('check swap rate', async function () {
        let swprate = await this.basket.swapRate(this.mockAave.address, this.mockWbtc.address);
        expect(swprate).to.equal(ethers.utils.parseUnits('1', 8))

        swprate = await this.basket.swapRate(this.mockWbtc.address, this.mockAave.address);
        expect(swprate).to.equal(ethers.utils.parseUnits('1', 18))
    })
    
});