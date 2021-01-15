import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { KarteraToken__factory, KarteraToken } from "../typechain";
import { CryptoTopTen__factory, CryptoTopTen } from "../typechain";
import { MockToken1__factory, MockToken1 } from "../typechain";
import { MockToken2__factory, MockToken2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

chai.use(solidity);
const { expect } = chai;

function tokens(n: string) {
  return ethers.utils.parseUnits(n, "ether");
}

let provider = ethers.getDefaultProvider();

describe("Kartera Token", function () {
  let Token: KarteraToken__factory;
  let kartera: KarteraToken;
  let CryptoTopTen: CryptoTopTen__factory;
  let cryptoTopTen: CryptoTopTen;
  let MockToken1: MockToken1__factory;
  let MockToken2: MockToken2__factory;
  let mockToken1: MockToken1;
  let mockToken2: MockToken2;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  before(async function () {
    // Get the ContractFactory and Signers here.
    Token = (await ethers.getContractFactory(
      "KarteraToken"
    )) as KarteraToken__factory;
    CryptoTopTen = (await ethers.getContractFactory(
      "CryptoTopTen"
    )) as CryptoTopTen__factory;
    MockToken1 = (await ethers.getContractFactory(
      "MockToken1"
    )) as MockToken1__factory;
    MockToken2 = (await ethers.getContractFactory(
      "MockToken2"
    )) as MockToken2__factory;
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    kartera = await Token.deploy();
    cryptoTopTen = await CryptoTopTen.deploy();
    mockToken1 = await MockToken1.deploy();
    mockToken2 = await MockToken2.deploy();
  });

  describe("Deployment", function () {
    it("Kartera token has the right owner", async function () {
      expect(await kartera.owner()).to.equal(owner.address);
    });

    it("CryptoTopTen has the right owner", async function () {
      expect(await cryptoTopTen.owner()).to.equal(owner.address);
    });

    it("MockToken1 has the right owner", async function () {
      expect(await mockToken1.owner()).to.equal(owner.address);
    });

    it("MockToken2 has the right owner", async function () {
      expect(await mockToken2.owner()).to.equal(owner.address);
    });

    it("kartera balance set at 1b tokens", async function () {
      const ownerBalance = await kartera.balanceOf(owner.address);
      expect(await kartera.totalSupply()).to.equal(tokens("1000000000"));
    });

    it("owner balance set at 1b tokens", async function () {
      const ownerBalance = await kartera.balanceOf(owner.address);
      expect(ownerBalance).to.equal(tokens("1000000000"));
    });

    it("kartera name check", async function () {
      const name = await kartera.name();
      expect(name).to.equal("Kartera Token");
    });

    it("kartera symbol check", async function () {
      const symbol = await kartera.symbol();
      expect(symbol).to.equal("KTT");
    });

  });

  describe("CryptoTopTen functions", function () {
    it("Crypto top ten name check", async function () {
      const name = await cryptoTopTen.name();
      expect(name).to.equal("Crypto Top Ten");
    });

    it("Crypto top ten symbol check", async function () {
      const symbol = await cryptoTopTen.symbol();
      expect(symbol).to.equal("CTT");
    });

    it("has correct total supply", async function () {
      const totalsupply = await cryptoTopTen.totalSupply();
      expect(totalsupply).to.equal(0);
    });

    it("Number of constituents check", async function () {
      await cryptoTopTen.addConstituent(mockToken1.address, 40);
      await cryptoTopTen.addConstituent(mockToken2.address, 40);
      const numberOfCons = await cryptoTopTen.numberOfConstituents();
      expect(numberOfCons).to.equal(2);
    });

    it("Constituents weight check", async function () {
      await cryptoTopTen.updateConstituent(mockToken1.address, 50);
      const weight = await cryptoTopTen.constituentWeight(mockToken1.address);
      expect(weight).to.equal(50);
    });

    it("Transfer to address1 check", async function () {
      await mockToken1.transfer(addr1.address, "1000000000000000000000");
      let ntokens = await mockToken1.balanceOf(addr1.address);
      expect(ntokens).to.equal("1000000000000000000000");
    });

    it("Number of active constituents check", async function () {
      // await cryptoTopTen.RemoveConstituent(mockToken1.address);
      const numberOfCons = await cryptoTopTen.numberOfActiveConstituents();
      expect(numberOfCons).to.equal(2);
    });

    it("Accepting deposit check", async function () {
      // await cryptoTopTen.RemoveConstituent(mockToken1.address);
      const acceptingdeposit = await cryptoTopTen.acceptingDeposit(
        mockToken1.address
      );
      expect(acceptingdeposit).to.equal(true);
    });
    
    it("Divisor check", async function () {
      const divisor = await cryptoTopTen.divisor();
      expect(divisor).to.equal(1);
    });

    it("Token price check", async function () {
      const divisor = await cryptoTopTen.tokenPrice();
      expect(divisor).to.equal(1000);
    });

    it("Make deposit check", async function () {
      await mockToken1
        .connect(addr1)
        .approve(cryptoTopTen.address, "1000000000000000000");
      await cryptoTopTen
        .connect(addr1)
        .makeDeposit(mockToken1.address, "1000000000000000000");
      const mt1balance = await mockToken1.balanceOf(cryptoTopTen.address);
      expect(mt1balance).to.equal("1000000000000000000");
    });
    // it('Make deposit check', async function(){
    //     const shares = await cryptoTopTen.MakeDeposit(mockToken1.address, 1000);
    //     console.log('shares received from 100 mock token1: ', shares );
    // })
  });
});
