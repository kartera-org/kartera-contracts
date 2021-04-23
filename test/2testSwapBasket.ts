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
        this.startblock += 20000;
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

    it('deposit 10000 wbtc in basket', async function(){
        this.decs = await this.mockWbtc.decimals();
        await this.mockWbtc.approve(this.basket.address, ethers.utils.parseUnits('10000', this.decs));
        await this.basket.addLiquidity(this.mockWbtc.address, ethers.utils.parseUnits('10000', this.decs));
    });

    it('add basket tokens to swap farm', async function () {
        await this.basket.approve(this.swapFarm.address, ethers.utils.parseEther('100'))
        await this.swapFarm.deposit(this.basket.address, ethers.utils.parseEther('100'));
    })

    it('check accumulated rewards', async function(){
        let rewards = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);

        console.log('rewards: ', rewards.toString() );
    })

    it('deposit 1.004709 eth in basket', async function () {
        let amt = ethers.utils.parseEther('.004709');
        await this.basket.addLiquidity(this.addr0, amt, {value: amt});
    })

    it('Ether balance in basket=100', async function () {

        let bal = await ethers.provider.getBalance(this.basket.address);
        expect(bal).to.equal(ethers.utils.parseEther('.004709'));
    })

    it('unpause swap trades', async function () {
        await this.basket.unpauseTrading();
    })

    it('ether balance of alice', async function (){
        let bal = await ethers.provider.getBalance(this.alice.address);
        console.log('bal: ', ethers.utils.formatUnits(bal) );
    })

    it('swap wbtc for ether', async function () {
        this.decs = await this.mockWbtc.decimals();
        let amt = ethers.utils.parseUnits('0.127', this.decs);
        await this.mockWbtc.approve(this.basket.address, amt);

        await this.basket.swap(this.mockWbtc.address, this.addr0, amt);
    })

    it('ether balance of alice afte swap', async function (){
        let bal = await ethers.provider.getBalance(this.alice.address);
        console.log('bal: ', ethers.utils.formatUnits(bal) );
    })

    
});