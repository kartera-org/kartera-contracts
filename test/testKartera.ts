//before running test modify DefiBasket.sol constituentPrice() and currencyPrice() to return $1 or 100000000
//there is no chainlink onchain price like on local node

import chai from "chai";
import { solidity } from "ethereum-waffle";
import { KarteraToken__factory, KarteraToken, KarteraPriceOracle } from "../typechain";
import { DefiBasket__factory, DefiBasket } from "../typechain";

import { MockAave__factory, MockAave } from "../typechain";
import { MockComp__factory, MockComp } from "../typechain";
import { MockMkr__factory, MockMkr } from "../typechain";
import { MockSnx__factory, MockSnx } from "../typechain";
import { MockSushi__factory, MockSushi } from "../typechain";
import { MockUma__factory, MockUma } from "../typechain";
import { MockUni__factory, MockUni } from "../typechain";
import { MockYfi__factory, MockYfi } from "../typechain";


import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";

chai.use(solidity);
const { expect } = chai;

let provider = ethers.getDefaultProvider();

describe("Kartera Token", function () {

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  before(async function () {
    // Get the ContractFactory and Signers here.

    this.KarteraToken = await ethers.getContractFactory("KarteraToken");
    this.kartera = await this.KarteraToken.deploy();
    
    this.DefiBasket = await ethers.getContractFactory("DefiBasket");
    this.defiBasket = await this.DefiBasket.deploy();

    this.KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
    this.karteraPriceOracle = await this.KarteraPriceOracle.deploy();
    
    await this.defiBasket.setPriceOracleAddress(this.karteraPriceOracle.address);
    
    
    this.MockAave = await ethers.getContractFactory("MockAave");
    this.MockComp = await ethers.getContractFactory("MockComp");
    this.MockMkr = await ethers.getContractFactory("MockMkr");
    this.MockSnx = await ethers.getContractFactory("MockSnx");
    this.MockSushi = await ethers.getContractFactory("MockSushi");
    this.MockUma = await ethers.getContractFactory("MockUma");
    this.MockUni = await ethers.getContractFactory("MockUni");
    this.MockYfi = await ethers.getContractFactory("MockYfi");

    this.mockAave = await this.MockAave.deploy();
    this.mockComp = await this.MockComp.deploy();
    this.mockMkr = await this.MockMkr.deploy();
    this.mockSnx = await this.MockSnx.deploy();
    this.mockSushi = await this.MockSushi.deploy();
    this.mockUma = await this.MockUma.deploy();
    this.mockUni = await this.MockUni.deploy();
    this.mockYfi = await this.MockYfi.deploy();

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.

  });

  describe("Deployment", function () {
    it("Kartera token has the right owner", async function () {
      expect(await this.kartera.owner()).to.equal(owner.address);
    });

    it("DefiBasket has the right owner", async function () {
      expect(await this.defiBasket.owner()).to.equal(owner.address);
    });

    //only checking MockAAVE other mocks are copy paste with name and symbol change

    it("MockAave has the right owner", async function () {
      expect(await this.mockAave.owner()).to.equal(owner.address);
    });

    it("MockAave balance set at 1b tokens", async function () {
      const ownerBalance = await this.mockAave.balanceOf(owner.address);
      expect(await this.mockAave.totalSupply()).to.equal(ethers.utils.parseEther("1000000000"));
    });

    it("owner balance set at 1b tokens", async function () {
      const ownerBalance = await this.mockAave.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.utils.parseEther("1000000000"));
    });

    it("mockAave name check", async function () {
      const name = await this.mockAave.name();
      expect(name).to.equal("Aave Mock Token");
    });

    it("mockAave symbol check", async function () {
      const symbol = await this.mockAave.symbol();
      expect(symbol).to.equal("mAAVE");
    });

  });

  describe("DefiBasket functions", function () {
    it("DefiBasket name check", async function () {
      const name = await this.defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");
    });

    it("DefiBasket symbol check", async function () {
      const symbol = await this.defiBasket.symbol();
      expect(symbol).to.equal("kDEFI");
    });

    it("has correct total supply", async function () {
      const totalsupply = await this.defiBasket.totalSupply();
      expect(totalsupply).to.equal(0);
    });

    it("Total # of constituents check ", async function () {
      await this.defiBasket.addConstituent(this.mockAave.address, 20, 30);
      await this.defiBasket.addConstituent(this.mockComp.address, 20, 30);
      await this.defiBasket.addConstituent(this.mockMkr.address, 10, 30);
      await this.defiBasket.addConstituent(this.mockSnx.address, 10, 30);
      await this.defiBasket.addConstituent(this.mockSushi.address, 10, 30);
      await this.defiBasket.addConstituent(this.mockUma.address, 10, 30);
      await this.defiBasket.addConstituent(this.mockUni.address, 10, 30);
      await this.defiBasket.addConstituent(this.mockYfi.address, 10, 30);

      await this.defiBasket.removeConstituent(this.mockYfi.address);

      const numberOfCons = await this.defiBasket.numberOfAllConstituents();
      expect(numberOfCons).to.equal(8);
    });

     it("Number of active constituents check", async function () {
      const numberOfCons = await this.defiBasket.numberOfActiveConstituents();
      expect(numberOfCons).to.equal(7);
    });

    it("Total Supply check", async function () {
      const divisor = await this.defiBasket.totalSupply();
      expect(divisor).to.equal(0);
    });

    it("Accepting deposit check", async function () {
      const acceptingdeposit = await this.defiBasket.acceptingDeposit(this.mockAave.address);
      expect(acceptingdeposit).to.equal(true);
    });

    it("Token price check", async function () {
      const tokenprice = await this.defiBasket.tokenPrice();
      expect(tokenprice).to.equal(ethers.utils.parseEther('100'));
    });
  });

  describe("DefiBasket functions reverts", function () {

    it("Adding existing contract should fail", async function(){
      await expect( this.defiBasket.addConstituent(this.mockAave.address, 20, 30)).to.be.revertedWith('Constituent already exists');
    });

    it(" Should fail to remove constituent that does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.removeConstituent(addr)).to.be.revertedWith('Constituent does not exist');
    });

    it('Should fail to update contract because of Constituent does not exist', async function () {
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.updateConstituent(addr, 30, 30)).to.be.revertedWith("Constituent does not exist");
    });

    it('Should fail to update contract because of max weight', async function () {
      await expect( this.defiBasket.updateConstituent(this.mockAave.address, 50, 30)).to.be.revertedWith("Total Weight Exceeds 100%");
    });

    it(" Should fail to remove constituent that does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.removeConstituent(addr)).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to make deposit because contract is not active  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.makeDeposit( addr, 10000000000 )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to make deposit because contract is not active  ", async function(){
       await expect( this.defiBasket.makeDeposit( this.mockYfi.address, 10000000000 )).to.be.revertedWith('Constituent is not active');
    });

    it(" Should fail withdraw component because token is active or does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.withdrawInactive( addr, 10000000000 )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to withdraw component because token is active or does not exist  ", async function(){
        await expect( this.defiBasket.withdrawInactive( this.mockAave.address, 10000000000 )).to.be.revertedWith('Cannot withdraw from active constituent');
    });
    ////// start here
    it(" Should fail to get constituent address ", async function(){
      await expect( this.defiBasket.getConstituentAddress(100)).to.be.revertedWith('Index exceeds array size');
    });
    
    it(" Should fail to getConstituentDetails constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.getConstituentDetails( addr )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to get Exchange Rate constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.exchangeRate( addr )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to get acceptingDeposit because constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( this.defiBasket.acceptingDeposit( addr )).to.be.revertedWith('Constituent does not exist');
    });

  });

  describe("DefiBasket make deposit functions", function () {

    it("Make deposit check", async function () {
      await this.mockAave
        .connect(owner)
        .approve(this.defiBasket.address, ethers.utils.parseEther("10000"));

      await this.defiBasket
        .connect(owner)
        .makeDeposit(this.mockAave.address, ethers.utils.parseEther("10000"));

      let aavebalanceInBasket = await this.mockAave.balanceOf(this.defiBasket.address);
      expect(aavebalanceInBasket).to.equal(ethers.utils.parseEther("10000"));
    });

    it(' Aave balance of basket check ', async function () {
      let aavebalance = await this.mockAave.balanceOf(this.defiBasket.address);

      console.log('aavebalance of basket:10,000: ',  ethers.utils.formatUnits(aavebalance));

      expect(aavebalance).to.equal(ethers.utils.parseEther('10000'));
    });

    it(' Basket balance of investor check ', async function () {
       let defibalance = await this.defiBasket.balanceOf(owner.address);
       expect(defibalance).to.equal(ethers.utils.parseEther('100'));
    });

    it(' Total Deposit after deposit check ', async function () {
       let totaldeposit = await this.defiBasket.totalDeposit();
       expect(totaldeposit).to.equal(ethers.utils.parseEther('10000'));
    });

    it(' Token Price Check after deposit ', async function () {
      let tokenprice = await this.defiBasket.tokenPrice();
      expect(tokenprice).to.equal(ethers.utils.parseEther('100'));
   });

  });

  describe("DefiBasket withdraw deposit functions", async function () {

    it("Withdraw check", async function () {

      await this.defiBasket.removeConstituent(this.mockAave.address);

      let defibaskettokens = 1;
      await this.defiBasket
        .connect(owner)
        .approve(this.defiBasket.address, ethers.utils.parseEther("1"));

      await this.defiBasket
        .connect(owner)
        .withdrawInactive(this.mockAave.address, ethers.utils.parseEther("1"));

      let aavebalanceInBasket = await this.mockAave.balanceOf(this.defiBasket.address);
      expect(aavebalanceInBasket).to.equal(ethers.utils.parseEther("9900"));
    });

  });

});