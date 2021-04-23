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

        this.SwapBasket2 = await ethers.getContractFactory("SwapBasket");
        this.basket2 = await this.SwapBasket2.deploy(this.karteraToken.address);
        console.log('basket2 address: ', this.basket2.address );
        await this.basket2.deployed();

        this.SwapLib2 = await ethers.getContractFactory("SwapLib");
        this.swaplib2 = await this.SwapLib2.deploy(this.basket2.address, this.karteraPriceOracle.address);
        console.log('swaplib2 address: ', this.swaplib2.address );
        await this.swaplib2.deployed();

        this.basket2.setSwapLib(this.swaplib2.address)


        this.MockAave = await ethers.getContractFactory("MockAave");
        this.mockAave = await this.MockAave.deploy();
        console.log('MockAave address: ', this.mockAave.address );
        await this.mockAave.deployed();
        this.MockMkr = await ethers.getContractFactory("MockMkr");
        this.mockMkr = await this.MockMkr.deploy();
        console.log('mockMkr address: ', this.mockMkr.address );
        await this.mockMkr.deployed();

        let link = ['0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockAave.address, 2, link);
        link = ['0x0B156192e04bAD92B6C1C13cf8739d14D78D5701', etherCLAddr];
        await this.karteraPriceOracle.addToken(this.mockMkr.address, 2, link);
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
        await this.basket2.setSwapFarmAddress(this.swapFarm.address);

        // deploy Kart Farm contract
        this.KartFarm = await ethers.getContractFactory("KarteraFarm");
        this.kartFarm = await this.KartFarm.deploy(this.karteraToken.address, this.karteraPriceOracle.address);
        await this.kartFarm.addBasket(this.basket.address);
        await this.kartFarm.addBasket(this.basket2.address);
        // set kartFarm address to basket
        await this.basket.setKartFarmAddress(this.kartFarm.address);
        await this.basket2.setKartFarmAddress(this.kartFarm.address);

    });

    it('basket state paused/unpaused', async function() {
        expect(await this.basket.pause_()).to.equal(true);
        await this.basket.unpause();
        await this.basket2.unpause();
        expect(await this.basket.pause_()).to.equal(false);
        expect(await this.basket2.pause_()).to.equal(false);
        let numberOfBlocks = 10;
        // for(let i=0; i<numberOfBlocks; i++){
        //     await time.advanceBlock();
        // }
    })

    it('check swap farm kart balance', async function () {

        await this.swapFarm.resetAllBaskets();
        let bal = await this.karteraToken.balanceOf(this.swapFarm.address);
        console.log('swap farm kart bal: ', ethers.utils.formatUnits(bal) );
    })

    it('check basket lib manager', async function() {
        expect( await this.swaplib.manager()).to.equal(this.basket.address);
    })

    it('add constituents to basket and check number', async function () {
        let addr ="0x0000000000000000000000000000000000000001";
        await this.basket.addConstituent(addr);
        await this.basket.addConstituent(this.mockAave.address);
        await this.basket.addConstituent(this.mockMkr.address);
        expect(await this.basket.numberOfActiveConstituents()).to.equal(3);
        expect(await this.basket.numberOfConstituents()).to.equal(3);

        await this.basket2.addConstituent(addr);
        await this.basket2.addConstituent(this.mockAave.address);
        await this.basket2.addConstituent(this.mockMkr.address);
    })

    it('swap basket token price should equal 100', async function() {
        expect(await this.basket.basketTokenPrice()).to.equal(ethers.utils.parseEther('100'));
    })

    it('check mockAave balance of alice', async function () {
        expect( await this.mockAave.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('1000000000'));
    })

    it('add liquidity to basket with 100 mockAave get 10000 basket token', async function() {
        await this.mockAave.approve(this.basket.address, ethers.utils.parseEther('1000000'));
        await this.basket.addLiquidity(this.mockAave.address, ethers.utils.parseEther('1000000'));
        expect(await this.basket.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('10000'));
        expect(await this.mockAave.balanceOf(this.basket.address)).to.equal(ethers.utils.parseEther('1000000'));
    })

    it('send bob 1000000 mock mkr', async function() {
        await this.mockMkr.transfer(this.bob.address, ethers.utils.parseEther('1000000'));
        expect(await this.mockMkr.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('1000000'));
    })

    it('send carol 1000000 mock mkr', async function() {
        await this.mockMkr.transfer(this.carol.address, ethers.utils.parseEther('1000000'));
        expect(await this.mockMkr.balanceOf(this.carol.address)).to.equal(ethers.utils.parseEther('1000000'));
    })

    it('carol add liquidity to basket with 10000 mockMkr get 100 basket token', async function() {
        await this.mockMkr.connect(this.carol).approve(this.basket.address, ethers.utils.parseEther('10000'));
        await this.basket.connect(this.carol).addLiquidity(this.mockMkr.address, ethers.utils.parseEther('10000'));
        expect(await this.basket.balanceOf(this.carol.address)).to.equal(ethers.utils.parseEther('100'));
        expect(await this.mockMkr.balanceOf(this.basket.address)).to.equal(ethers.utils.parseEther('10000'));
    })

    it('check swap rate', async function () {
        let swaprate = await this.basket.swapRate(this.mockMkr.address, this.mockAave.address);
        console.log('swaprate: ', ethers.utils.formatUnits(swaprate) );
    })

    it('carol withdraw liquidity from basket, 1 basket token for mockAave', async function () {
        let cost = await this.basket.withdrawCost(ethers.utils.parseEther('1'));
        expect(cost).to.equal(ethers.utils.parseEther('1'));
    })

    it('basket value is 100', async function () {
        expect( await this.basket.basketTokenPrice()).to.equal(ethers.utils.parseEther('100'));
    })

    it('basket total supply should be 10100', async function (){
        expect(await this.basket.totalSupply()).to.equal(ethers.utils.parseEther('10100'));
    })

    it('swap should revert', async function () {
        await this.mockMkr.connect(this.bob).approve(this.basket.address, ethers.utils.parseEther('100'));
        await expectRevert( this.basket.connect(this.bob).swap(this.mockMkr.address, this.mockAave.address, ethers.utils.parseEther('100')), 'Swapping is paused');

        await this.basket.unpauseTrading();

        let tradingstatus = await this.basket.tradingAllowed_();
        console.log('trading status: ', tradingstatus );
    })

    it('bob swap 100 mockmkr to mockaave and check balances ', async function() {

        await this.mockMkr.connect(this.bob).approve(this.basket.address, ethers.utils.parseEther('100'));
        await this.basket.connect(this.bob).swap(this.mockMkr.address, this.mockAave.address, ethers.utils.parseEther('100'));
        expect(await this.mockAave.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('99.7'))
        expect(await this.mockAave.balanceOf(this.basket.address)).to.equal(ethers.utils.parseEther('999900.3'));
        expect(await this.mockMkr.balanceOf(this.basket.address)).to.equal(ethers.utils.parseEther('10100'));
    })

    it('basket total deposit should equal 10100.3', async function () {
        expect(await this.basket.totalDeposit()).to.equal(ethers.utils.parseEther('1010000.3'));

    })

    it('basket total supply should be 10100.0005', async function (){
        expect(await this.basket.totalSupply()).to.equal(ethers.utils.parseEther('10100.0005'));
    })

    it('basket value is 100+ after swap', async function () {
        let prc = await this.basket.basketTokenPrice();
        console.log('basket price after swap: ', ethers.utils.formatUnits(prc) );
    })

    it('kartera token balance in swap farm', async function () {
        let bal = await this.karteraToken.balanceOf(this.swapFarm.address);
        expect(bal).equal(ethers.utils.parseEther('0'));
    })

    it('alice deposit basket tokens in swap farm', async function () {

        await this.basket.approve(this.swapFarm.address, ethers.utils.parseEther('10000'));
        await this.swapFarm.deposit(this.basket.address, ethers.utils.parseEther('10000'));
        expect( await this.basket.balanceOf(this.swapFarm.address)).to.equal(ethers.utils.parseEther('10000'));
        let blknumber = await ethers.provider.getBlockNumber();
        console.log('current block#: ', blknumber.toString() );

        let numberOfBlocks = 10;
        for(let i=0; i<numberOfBlocks; i++){
            await time.advanceBlock();
        }
        console.log('start block: ', this.startblock.toString() );
        console.log('end bonus block#: ', this.endbonusofferblock.toString() );

        let bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
        console.log('rewards balance after deposit: ', ethers.utils.formatUnits(bal) );

        blknumber = await ethers.provider.getBlockNumber();
        console.log('current block#: ', blknumber.toString() );
    })

    it('add liq to basket2 and add basket2 to swap farm', async function () {
        await this.swapFarm.addBasket(this.basket2.address, '100');

        await this.mockMkr.approve(this.basket2.address, ethers.utils.parseEther('10000'));
        await this.basket2.addLiquidity(this.mockMkr.address, ethers.utils.parseEther('10000'));

    })

    it('add basket2 tokens to swap farm ', async function () {

        let bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
        console.log('basket rewards balance after deposit: ', ethers.utils.formatUnits(bal) );
        await this.swapFarm.modifyBasket(this.basket.address, '0');

        await this.basket2.approve(this.swapFarm.address, ethers.utils.parseEther('100'));
        await this.swapFarm.deposit(this.basket2.address, ethers.utils.parseEther('100'));

        let blknumber = await ethers.provider.getBlockNumber();
        console.log('current block#: ', blknumber.toString() );

        let numberOfBlocks = 2;
        for(let i=0; i<numberOfBlocks; i++){
            await time.advanceBlock();
        }
        console.log('start block: ', this.startblock.toString() );
        console.log('end bonus block#: ', this.endbonusofferblock.toString() );

        bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket2.address);
        console.log('basket2 rewards balance after deposit: ', ethers.utils.formatUnits(bal) );
        bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
        console.log('basket rewards balance after deposit: ', ethers.utils.formatUnits(bal) );

        blknumber = await ethers.provider.getBlockNumber();
        console.log('current block#: ', blknumber.toString() );

    })

    it('remove constituent from basket and add liquidity', async function (){
        
        let n = await this.basket.numberOfActiveConstituents();
        console.log('number Of Active cons: ', n.toString() );

        await this.basket.removeConstituent(this.mockAave.address);

        n = await this.basket.numberOfActiveConstituents();
        console.log('number Of Active cons after: ', n.toString());

        await this.mockAave.approve(this.basket.address, ethers.utils.parseEther('1'));
        await expectRevert(this.basket.addLiquidity(this.mockAave.address, ethers.utils.parseEther('1')), 'Constituent is not active')

    })


    // it('alice locked basket tokens in swapFarm should be 10000', async function () {
    //     expect( await this.swapFarm.lockedTokens(this.alice.address, this.basket.address)).to.equal(ethers.utils.parseEther('10000'));
    // })
    // it('number of swap baskets in swapFarm=1', async function () {
    //     expect(await this.swapFarm.numberOfBaskets()).to.equal('1');
    // })
    // it('basket allocation = 100', async function () {
    //   let alloc = await this.swapFarm.basketAllocation(this.basket.address);
    //   console.log('//////////////////////////////////////////////' );
    //   console.log('//////////////////////////////////////////////' );
    //   console.log('alloc: ', alloc.toString() );
    //   console.log('//////////////////////////////////////////////' );
    //   console.log('//////////////////////////////////////////////' );
    //     // expect( await this.swapFarm.basketAllocation(this.basket.address)).to.equal('100');
    // })

    // it('basket address in swapFarm', async function () {
    //     expect( await this.swapFarm.basketAddress(0)).to.equal(this.basket.address );
    // })

    // it('withdraw and check balances', async function () {

    //     console.log('////////////////////////////////: ',  );
    //     console.log('////////////////////////////////: ',  );
    //     let bn = await ethers.provider.getBlockNumber();
    //     console.log('current block#: ', bn.toString() );
    //     console.log('start block#: ', this.startblock.toString() );
    //     console.log('end bonus block#: ', this.endbonusofferblock.toString() );

    //     console.log('////////////////////////////////: ',  );
    //     console.log('////////////////////////////////: ',  );

    //     // let numberOfBlocks = 10;
    //     // for(let i=0; i<numberOfBlocks; i++){
    //     //     await time.advanceBlock();
    //     // }

    //     let pendingrewards = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
    //     console.log('pendingrewards: ', pendingrewards.toString() );
    //     // expect(pendingrewards).to.equal(ethers.utils.parseEther('10000'))

    //     // await this.swapFarm.connect(this.alice).collectRewards(this.basket.address);
    //     // let bal = await this.karteraToken.balanceOf(this.alice.address);
    //     // console.log('alice kart bal: ', ethers.utils.formatUnits(bal) );
    //     await this.swapFarm.withdraw(this.basket.address, ethers.utils.parseEther('5000'));
    //     expect( await this.karteraToken.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('8300'));
    //     expect(await this.basket.balanceOf(this.alice.address)).to.equal(ethers.utils.parseEther('5000'));
    //     expect(await this.basket.balanceOf(this.swapFarm.address)).to.equal(ethers.utils.parseEther('5000'));

    //     pendingrewards = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
    //     console.log('pendingrewards after withdraw: ', pendingrewards.toString() );

    // } )

    // it('transfer 5000 basket to bob deposit in farm and withdraw and check balances', async function () {

    //     let pending = await this.swapFarm.accumulatedRewards(this.bob.address, this.basket.address);
    //     expect(pending).to.equal(ethers.utils.parseEther('0'));

    //     await this.basket.transfer(this.bob.address, ethers.utils.parseEther('5000'));
    //     expect(await this.basket.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('5000'));
    //     expect(await this.basket.balanceOf(this.swapFarm.address)).to.equal(ethers.utils.parseEther('5000'));
    //     await this.basket.connect(this.bob).approve(this.swapFarm.address, ethers.utils.parseEther('5000'));
    //     await this.swapFarm.connect(this.bob).deposit(this.basket.address, ethers.utils.parseEther('5000'));
    //     expect(await this.basket.balanceOf(this.swapFarm.address)).to.equal(ethers.utils.parseEther('10000'));
    // })

    // it('collect rewards for bob', async function () {

    //     // expect bob's kart balance before collecting from basket farm=0
    //     expect(await this.karteraToken.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('0'));

    //     let numberOfBlocks = 10;
    //     for(let i=0; i<numberOfBlocks; i++){
    //         await time.advanceBlock();
    //     }

    //     let pending = await this.swapFarmLib.accumulatedRewards(this.bob.address, this.basket.address);
    //     expect(pending).to.equal(ethers.utils.parseEther('500'));

    //     await this.swapFarm.connect(this.bob).withdraw(this.basket.address, ethers.utils.parseEther('5'));
    //     expect(await this.karteraToken.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('550'));

        
    //     expect(await this.swapFarmLib.accumulatedRewards(this.alice.address, this.basket.address)).to.equal(ethers.utils.parseEther('850') );
    // })

    // it('withdraw for bob and check his kart balance', async function () {

    //     expect( await this.karteraToken.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('550'));

    //     let numberOfBlocks = 10;
    //     for(let i=0; i<numberOfBlocks; i++){
    //         await time.advanceBlock();
    //     }

    //     await this.swapFarm.connect(this.bob).withdraw(this.basket.address, ethers.utils.parseEther('1'));

    //     let bobKartBal = await this.karteraToken.balanceOf(this.bob.address);
    //     console.log('bobsKart balance: ', ethers.utils.formatUnits(bobKartBal) );
    // })

    // it('check bobs basket and kartera bal before and after withdraw liq', async function () {

    //     let withdrawCost = await this.basket.withdrawCost(ethers.utils.parseEther("2"));

    //     await this.karteraToken.connect(this.bob).approve(this.basket.address, withdrawCost);

    //     await this.basket.connect(this.bob).withdrawLiquidity(this.mockAave.address, ethers.utils.parseEther('2'));

    //     expect( await this.basket.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('4'));

    // })

    // it('Kart Farm number of baskets=2 ', async function () {

    //     expect(await this.kartFarm.numberOfBaskets()).to.equal('2');
    // });

    // it('Set Kart Farm to use exchange price for Kart token', async function () {
    //     // await this.kartFarm.setUseExPrice();
    //     let exprice = await this.kartFarm.exPrice();
    //     console.log('exprice: ', exprice );
    // })

    // it('Kart Farm baskets value= 0.05', async function () {

    //     let basketPrc = await this.basket.basketTokenPrice();
    //     console.log('basket Prc: ', ethers.utils.formatUnits(basketPrc) );
    //     // let v = ethers.utils.formatUnits(basketPrc);
    //     // let val = parseFloat(v)*0.0005;

    //     let basketval = await this.kartFarm.basketValue(0);
    //     console.log('basket value in kart farm: ', ethers.utils.formatUnits(basketval) );
    // });

    // it('Kart Farm check ', async function () {

    //     expect(await this.basket.balanceOf(this.kartFarm.address)).to.equal(ethers.utils.parseEther('0.0005'));

    //     await this.karteraToken.connect(this.bob).approve(this.kartFarm.address, ethers.utils.parseEther('1'));
    //     await this.kartFarm.connect(this.bob).deposit(ethers.utils.parseEther('1'));       

    // })

    // it('check xKart supply=100', async function () {
    //     expect(await this.kartFarm.balanceOf(this.bob.address)).to.equal(ethers.utils.parseEther('1'));
    // })

    // it('alice deposit 1 more kart tokens in Kart farm check xKart supply', async function () {
    //     await this.karteraToken.approve(this.kartFarm.address, ethers.utils.parseEther('1'));
    //     await this.kartFarm.deposit(ethers.utils.parseEther('1'));

    //     let xKartAliceBal = await this.kartFarm.balanceOf(this.alice.address);
    //     console.log('xKartAliceBal: ', ethers.utils.formatUnits(xKartAliceBal) );
    // })

    // it('check kart balance of kartFarm=1100', async function () {
    //     expect(await this.karteraToken.balanceOf(this.kartFarm.address)).to.equal(ethers.utils.parseEther('2'));
    // });

    // it('get xKart share price', async function () {

    //     let xPrc = await this.kartFarm.xKartPrice();
    //     console.log('xPrice: ', ethers.utils.formatUnits(xPrc) );

    //     xPrc = await this.kartFarm.kartValue(ethers.utils.parseEther('1'));
    //     console.log(' Kart Price: ', ethers.utils.formatUnits(xPrc) );

    //     let bal = await this.karteraToken.balanceOf(this.kartFarm.address);
    //     console.log('kart bal of kart farm: ', ethers.utils.formatEther(bal));
    // })

    // // it('withdraw from kart farm and check kart balances, bobs kart balance should be higher by 100.005', async function () {
    // //     let bal = await this.karteraToken.balanceOf(this.bob.address);
    // //     console.log('kar bal before withdraw from kart farm: ', ethers.utils.formatEther(bal));

    // //     await this.kartFarm.connect(this.bob).withdraw(ethers.utils.parseEther('0.001'));

    // //     bal = await this.karteraToken.balanceOf(this.bob.address);
    // //     console.log('kar bal before withdraw from kart farm: ', ethers.utils.formatEther(bal));

    // // })

    // it('swap big size to make xkart value large', async function (){

    //     // await this.mockMkr.approve(this.carol.address, ethers.utils.parseEther('100000'));
    //     // await this.mockMkr.transfer(this.carol.address,  ethers.utils.parseEther('100000'));

    //     await this.mockMkr.connect(this.carol).approve(this.basket.address, ethers.utils.parseEther('79984'));
    //     await this.basket.connect(this.carol).swap(this.mockMkr.address, this.mockAave.address, ethers.utils.parseEther('79984'));

    //     let baketBal_kartfarm = await this.basket.balanceOf(this.kartFarm.address);
    //     console.log('baketBal_kartfarm: ', ethers.utils.formatUnits(baketBal_kartfarm) );

    //     await this.mockAave.connect(this.carol).approve(this.basket.address, ethers.utils.parseEther('7900'));
    //     await this.basket.connect(this.carol).swap(this.mockAave.address, this.mockMkr.address, ethers.utils.parseEther('7900'));

    //     baketBal_kartfarm = await this.basket.balanceOf(this.kartFarm.address);
    //     console.log('baketBal_kartfarm: ', ethers.utils.formatUnits(baketBal_kartfarm) );

    //     await this.mockMkr.connect(this.carol).approve(this.basket.address, ethers.utils.parseEther('79984'));
    //     await this.basket.connect(this.carol).swap(this.mockMkr.address, this.mockAave.address, ethers.utils.parseEther('79984'));

    //     baketBal_kartfarm = await this.basket.balanceOf(this.kartFarm.address);
    //     console.log('baketBal_kartfarm: ', ethers.utils.formatUnits(baketBal_kartfarm) );


    // })

    // it('check xKart Price', async function () {
    //     let prc = await this.kartFarm.xKartPrice();
    //     console.log('xKart prc: ', ethers.utils.formatUnits(prc) );

    //     prc = await this.kartFarm.totalAssetValue();
    //     console.log('total asset value: ', ethers.utils.formatUnits(prc) );

    //     prc = await this.kartFarm.kartValue(ethers.utils.parseEther('1'));
    //     console.log('KART price: ', ethers.utils.formatUnits(prc) );

    //     prc = await this.kartFarm.totalSupply();
    //     console.log('xKart total supply: ', ethers.utils.formatUnits(prc) );
    // })

    // it('check basket balances and withdraw', async function() {
    //     let bal = await this.karteraToken.balanceOf(this.bob.address)
    //     console.log('bobs kartera bal: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.basket.balanceOf(this.bob.address)
    //     console.log('bobs basket balance bal: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.kartFarm.balanceOf(this.bob.address)
    //     console.log('bobs kartera Farm bal: ', ethers.utils.formatUnits(bal) );

    //     // bob to withdraw from Kart Farm deposit 1 xKart
    //     await this.kartFarm.connect(this.bob).withdraw(ethers.utils.parseEther('1'));

    //     bal = await this.karteraToken.balanceOf(this.bob.address)
    //     console.log('bobs kartera bal after withdraw: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.basket.balanceOf(this.bob.address)
    //     console.log('bobs basket balance bal after withdraw: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.kartFarm.balanceOf(this.bob.address)
    //     console.log('bobs kartera Farm bal after withdraw: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.karteraToken.balanceOf(this.kartFarm.address)
    //     console.log('Kart Farm kartera bal after withdraw: ', ethers.utils.formatUnits(bal) );

    //     bal = await this.basket.balanceOf(this.kartFarm.address)
    //     console.log('Kart Farm basket balance bal after withdraw: ', ethers.utils.formatUnits(bal) );

    //     let prc = await this.kartFarm.xKartPrice();
    //     console.log('xKart price: ', ethers.utils.formatUnits(prc) );

    //     let totalsupply = await this.kartFarm.totalSupply();
    //     console.log('xKart total supply: ', ethers.utils.formatUnits(totalsupply) );

    //     await this.karteraToken.connect(this.bob).approve(this.kartFarm.address, ethers.utils.parseEther('50') )
    //     await this.kartFarm.connect(this.bob).deposit(ethers.utils.parseEther('50'));

    //     totalsupply = await this.kartFarm.totalSupply();
    //     console.log('xKart total supply: ', ethers.utils.formatUnits(totalsupply) );

    // })

    // it('test ether deposits in swap basket', async function () {
    //     let addr ="0x0000000000000000000000000000000000000001";

    //     await this.basket.addLiquidity(addr, ethers.utils.parseEther('100'), {value: ethers.utils.parseEther('100')});
    //     let bal = await ethers.provider.getBalance(this.basket.address);
    //     expect(bal).to.equal(ethers.utils.parseEther('100'));
    // })

    // it('test ether swap basket aave->ether', async function () {
    //     let addr ="0x0000000000000000000000000000000000000001";
    //     let bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('eth bal before swap: ', ethers.utils.formatUnits(bal) );
    //     await this.mockAave.approve(this.basket.address, ethers.utils.parseEther('1'));
    //     await this.basket.swap(this.mockAave.address, addr, ethers.utils.parseEther('1'));
    //     bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('eth bal after swap: ', ethers.utils.formatUnits(bal) );
    //     expect(bal).to.equal(ethers.utils.parseEther('99.006'));

    // })

    // it('test ether swap eth->aave', async function () {
    //     let addr ="0x0000000000000000000000000000000000000001";
    //     let bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('eth bal before swap: ', ethers.utils.formatUnits(bal) );
    //     await this.basket.swap(addr, this.mockAave.address, ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('1')});
    //     bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('eth bal after swap: ', ethers.utils.formatUnits(bal) );
    //     expect(bal).to.equal(ethers.utils.parseEther('100.006'));
    // })

    // it('test ether withdraw liquidity', async function () {

    //     let bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('bal of ether : ', ethers.utils.formatEther(bal) );

    //     let addr ="0x0000000000000000000000000000000000000001";
    //     let withdrawCost = await this.basket.withdrawCost(ethers.utils.parseEther("0.01"));
    //     await this.karteraToken.approve(this.basket.address, withdrawCost);
    //     await this.basket.withdrawLiquidity(addr, ethers.utils.parseEther('0.01'));
    //     bal = await ethers.provider.getBalance(this.basket.address);
    //     console.log('bal of ether after withdraw: ', ethers.utils.formatEther(bal) );
    // })

    // it('create new basket and add to swap farm', async function () {

    //     // let allocation = '100';
    //     // await this.swapFarm.addBasket(this.basket2.address, allocation);
    //     // await this.mockAave.approve(this.basket2.address, ethers.utils.parseEther('10000'));
    //     // await this.basket2.addLiquidity(this.mockAave.address, ethers.utils.parseEther('10000'))

    //     // await this.basket2.approve(this.swapFarm.address, ethers.utils.parseEther('100'))
    //     // await this.swapFarm.deposit(this.alice.address, this.basket2.address, ethers.utils.parseEther('100'));

    //     // let bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket2.address);
    //     // console.log('bal of kartera with swap farm: ', ethers.utils.formatUnits(bal) );


    // })


    // it('check kart balance in swap basket farm, modify allocation and check again', async function () {

    //     // let bask_bal = await this.basket.balanceOf(this.swapFarm.address);
    //     // console.log('bask_bal: ', ethers.utils.formatUnits(bask_bal) );

    //     // let bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
    //     // console.log('bal of kartera with swap farm: ', ethers.utils.formatUnits(bal) );
    //     // let allocation = '0';
    //     // await this.swapFarm.modifyBasket(this.basket.address, allocation);

    //     // bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
    //     // console.log('bal of kartera with swap farm: ', ethers.utils.formatUnits(bal) );

    //     // await this.mockAave.approve(this.basket.address, ethers.utils.parseEther('100'));
    //     // await this.basket.addLiquidity(this.mockAave.address, ethers.utils.parseEther('100'))

    //     // bal = await this.swapFarm.accumulatedRewards(this.alice.address, this.basket.address);
    //     // console.log('bal of kartera with swap farm: ', ethers.utils.formatUnits(bal) );


    // })

    
});