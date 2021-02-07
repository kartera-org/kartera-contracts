//before running test modify DefiBasket.sol constituentPrice() and currencyPrice() to return $1 or 100000000
//there is no chainlink onchain price like on local node

import chai from "chai";
import { solidity } from "ethereum-waffle";
import { KarteraToken__factory, KarteraToken } from "../typechain";
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
  let KarteraToken: KarteraToken__factory;
  let kartera: KarteraToken;
  let DefiBasket: DefiBasket__factory;
  let defiBasket: DefiBasket;

  let MockAave: MockAave__factory;
  let MockComp: MockAave__factory;
  let MockMkr: MockAave__factory;
  let MockSnx: MockAave__factory;
  let MockSushi: MockAave__factory;
  let MockUma: MockAave__factory;
  let MockUni: MockAave__factory;
  let MockYfi: MockAave__factory;

  let mockAave: MockAave;
  let mockComp: MockComp;
  let mockMkr: MockMkr;
  let mockSnx: MockSnx;
  let mockSushi: MockSushi;
  let mockUma: MockUma;
  let mockUni: MockUni;
  let mockYfi: MockYfi;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  before(async function () {
    // Get the ContractFactory and Signers here.

    KarteraToken = (await ethers.getContractFactory("KarteraToken")) as KarteraToken__factory;
    kartera = await KarteraToken.deploy();
    
    DefiBasket = (await ethers.getContractFactory("DefiBasket")) as DefiBasket__factory;
    defiBasket = await DefiBasket.deploy();
    
    MockAave = (await ethers.getContractFactory("MockAave")) as MockAave__factory;
    MockComp = (await ethers.getContractFactory("MockComp")) as MockComp__factory;
    MockMkr = (await ethers.getContractFactory("MockMkr")) as MockMkr__factory;
    MockSnx = (await ethers.getContractFactory("MockSnx")) as MockSnx__factory;
    MockSushi = (await ethers.getContractFactory("MockSushi")) as MockSushi__factory;
    MockUma = (await ethers.getContractFactory("MockUma")) as MockUma__factory;
    MockUni = (await ethers.getContractFactory("MockUni")) as MockUni__factory;
    MockYfi = (await ethers.getContractFactory("MockYfi")) as MockYfi__factory;

    mockAave = await MockAave.deploy();
    mockComp = await MockComp.deploy();
    mockMkr = await MockMkr.deploy();
    mockSnx = await MockSnx.deploy();
    mockSushi = await MockSushi.deploy();
    mockUma = await MockUma.deploy();
    mockUni = await MockUni.deploy();
    mockYfi = await MockYfi.deploy();

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.

  });

  describe("Deployment", function () {
    it("Kartera token has the right owner", async function () {
      expect(await kartera.owner()).to.equal(owner.address);
    });

    it("DefiBasket has the right owner", async function () {
      expect(await defiBasket.owner()).to.equal(owner.address);
    });

    //only checking MockAAVE other mocks are copy paste with name and symbol change

    it("MockAave has the right owner", async function () {
      expect(await mockAave.owner()).to.equal(owner.address);
    });

    it("MockAave balance set at 1b tokens", async function () {
      const ownerBalance = await mockAave.balanceOf(owner.address);
      expect(await mockAave.totalSupply()).to.equal(ethers.utils.parseEther("1000000000"));
    });

    it("owner balance set at 1b tokens", async function () {
      const ownerBalance = await mockAave.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.utils.parseEther("1000000000"));
    });

    it("mockAave name check", async function () {
      const name = await mockAave.name();
      expect(name).to.equal("Aave Mock Token");
    });

    it("mockAave symbol check", async function () {
      const symbol = await mockAave.symbol();
      expect(symbol).to.equal("mAAVE");
    });

  });

  describe("DefiBasket functions", function () {
    it("DefiBasket name check", async function () {
      const name = await defiBasket.name();
      expect(name).to.equal("Kartera Defi Basket");
    });

    it("DefiBasket symbol check", async function () {
      const symbol = await defiBasket.symbol();
      expect(symbol).to.equal("kDEFI");
    });

    it("has correct total supply", async function () {
      const totalsupply = await defiBasket.totalSupply();
      expect(totalsupply).to.equal(0);
    });

    it("Total # of constituents check ", async function () {
      await defiBasket.addConstituent(mockAave.address, 20, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockComp.address, 20, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockMkr.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockSnx.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockSushi.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockUma.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockUni.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");
      await defiBasket.addConstituent(mockYfi.address, 10, 30, "0xF7904a295A029a3aBDFFB6F12755974a958C7C25");

      await defiBasket.removeConstituent(mockYfi.address);

      const numberOfCons = await defiBasket.numberOfAllConstituents();
      expect(numberOfCons).to.equal(8);
    });

     it("Number of active constituents check", async function () {
      const numberOfCons = await defiBasket.numberOfActiveConstituents();
      expect(numberOfCons).to.equal(7);
    });

    it("Total Supply check", async function () {
      const divisor = await defiBasket.totalSupply();
      expect(divisor).to.equal(0);
    });

    it("Accepting deposit check", async function () {
      const acceptingdeposit = await defiBasket.acceptingDeposit(mockAave.address);
      expect(acceptingdeposit).to.equal(true);
    });

    it("Token price check", async function () {
      const tokenprice = await defiBasket.tokenPrice();
      expect(tokenprice).to.equal(100000000000);
    });
  });

  describe("DefiBasket functions reverts", function () {

    it("Adding existing contract should fail", async function(){
      await expect( defiBasket.addConstituent(mockAave.address, 20, 30, '0xF7904a295A029a3aBDFFB6F12755974a958C7C25')).to.be.revertedWith('Constituent already exists and is active');
    });

    it(" Should fail to remove constituent that does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.removeConstituent(addr)).to.be.revertedWith('Constituent does not exist');
    });

    it('Should fail to update contract because of Constituent does not exist', async function () {
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.updateConstituent(addr, 30, 30)).to.be.revertedWith("Constituent does not exist");
    });

    it('Should fail to update contract because of max weight', async function () {
      await expect( defiBasket.updateConstituent(mockAave.address, 50, 30)).to.be.revertedWith("Total Weight Exceeds 100%");
    });

    it(" Should fail to remove constituent that does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.removeConstituent(addr)).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to make deposit because contract is not active  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.makeDeposit( addr, 10000000000 )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to make deposit because contract is not active  ", async function(){
       await expect( defiBasket.makeDeposit( mockYfi.address, 10000000000 )).to.be.revertedWith('Constituent is not active');
    });

    it(" Should fail withdraw component because token is active or does not exist  ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.withdrawComponent( addr, 10000000000 )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to withdraw component because token is active or does not exist  ", async function(){
        await expect( defiBasket.withdrawComponent( mockAave.address, 10000000000 )).to.be.revertedWith('Cannot withdraw from active constituent');
    });
    ////// start here
    it(" Should fail to get constituent address ", async function(){
      await expect( defiBasket.getConstituentAddress(100)).to.be.revertedWith('Index exceeds array size');
    });
    
    it(" Should fail to getConstituentDetails constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.getConstituentDetails( addr )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to get Exchange Rate constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.exchangeRate( addr )).to.be.revertedWith('Constituent does not exist');
    });

    it(" Should fail to get acceptingDeposit because constituent does not exist ", async function(){
      let addr = "0xF7904a295A029a3aBDFFB6F12755974a958C7C25";
      await expect( defiBasket.acceptingDeposit( addr )).to.be.revertedWith('Constituent does not exist');
    });

  });

  describe("DefiBasket make deposit functions", function () {

    it("Make deposit check", async function () {
      await mockAave
        .connect(owner)
        .approve(defiBasket.address, ethers.utils.parseEther("10000"));

      await defiBasket
        .connect(owner)
        .makeDeposit(mockAave.address, ethers.utils.parseEther("10000"));

      let aavebalanceInBasket = await mockAave.balanceOf(defiBasket.address);
      expect(aavebalanceInBasket).to.equal(ethers.utils.parseEther("10000"));
    });

    it(' Aave balance of basket check ', async function () {
      let aavebalance = await mockAave.balanceOf(defiBasket.address);

      console.log('aavebalance of basket:10,000: ',  ethers.utils.formatUnits(aavebalance));

      expect(aavebalance).to.equal(ethers.utils.parseEther('10000'));
    });

    it(' Basket balance of investor check ', async function () {
       let defibalance = await defiBasket.balanceOf(owner.address);
       expect(defibalance).to.equal(ethers.utils.parseEther('10'));
    });

    it(' Total Deposit after deposit check ', async function () {
       let totaldeposit = await defiBasket.totalDeposit();
       expect(totaldeposit).to.equal("1000000000000000000000000000000");
    });

    it(' Token Price Check after deposit ', async function () {
      let tokenprice = await defiBasket.tokenPrice();
      expect(tokenprice).to.equal("100000000000");
   });

  });

  describe("DefiBasket withdraw deposit functions", async function () {

    it("Withdraw check", async function () {

      await defiBasket.removeConstituent(mockAave.address);

      let defibaskettokens = 1;
      await defiBasket
        .connect(owner)
        .approve(defiBasket.address, ethers.utils.parseEther("1"));

      await defiBasket
        .connect(owner)
        .withdrawComponent(mockAave.address, ethers.utils.parseEther("1"));

      let aavebalanceInBasket = await mockAave.balanceOf(defiBasket.address);
      expect(aavebalanceInBasket).to.equal(ethers.utils.parseEther("9000"));
    });

  });
  describe("Fee and factor check", async function () {

    it("Fee - factor check", async function () {
      expect( await defiBasket.getFeeFactor()).to.equal('1000');
      // update fee factor
      await defiBasket.updateFeeFactor('2000');
      expect( await defiBasket.getFeeFactor()).to.equal('2000');

    });
  });

});