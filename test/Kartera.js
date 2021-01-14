const { expect } = require("chai");
const { ethers } = require("hardhat");

function tokens(n){
    return ethers.utils.parseUnits(n, 'ether');
}

let provider = ethers.getDefaultProvider();

describe('Kartera Token', function(){

    let Token;
    let kartera;
    let CryptoTopTen, cryptoTopTen;
    let MockToken1, MockToken2;
    let mockToken1, mockToken2;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    before(async function () {
    // Get the ContractFactory and Signers here.
        Token = await ethers.getContractFactory("KarteraToken");
        CryptoTopTen = await ethers.getContractFactory("CryptoTopTen");
        MockToken1 = await ethers.getContractFactory("MockToken1");
        MockToken2 = await ethers.getContractFactory("MockToken2");
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
          expect(await kartera.totalSupply()).to.equal(tokens('1000000000'));
        });
        it("owner balance set at 1b tokens", async function () {
            const ownerBalance = await kartera.balanceOf(owner.address);
            expect(ownerBalance).to.equal(tokens('1000000000'));
        });

        it("kartera name check", async function () {
            const name = await kartera.name();
            expect(name).to.equal('Kartera Token');
        });
        it("kartera symbol check", async function () {
            const symbol = await kartera.symbol();
            expect(symbol).to.equal('KTT');
        });
    });

    describe("CryptoTopTen functions", function(){
        it('Crypto top ten name check', async function(){
            const name =  await cryptoTopTen.name();
            expect(name).to.equal('Crypto Top Ten');
        })
        it('Crypto top ten symbol check', async function(){
            const symbol =  await cryptoTopTen.symbol();
            expect(symbol).to.equal('CTT');
        })
        it('has correct total supply', async function(){
            const totalsupply =  await cryptoTopTen.totalSupply();
            expect(totalsupply).to.equal(0);
        })
        it('Number of constituents check', async function(){
            await cryptoTopTen.AddConstituent(mockToken1.address, 40);
            await cryptoTopTen.AddConstituent(mockToken2.address, 40);
            const numberOfCons=  await cryptoTopTen.NumberOfConstituents();
            expect(numberOfCons).to.equal(2);
        })
        it('Constituents weight check', async function(){
            await cryptoTopTen.UpdateConstituent(mockToken1.address, 50);
            const weight =  await cryptoTopTen.ConstituentWeight(mockToken1.address);
            expect(weight).to.equal(50);
        })
        it('Transfer to address1 check', async function(){
            await mockToken1.transfer(addr1.address, '1000000000000000000000');
            let ntokens = await mockToken1.balanceOf(addr1.address)
            expect(ntokens).to.equal('1000000000000000000000');
        })
        it('Number of active constituents check', async function(){
            // await cryptoTopTen.RemoveConstituent(mockToken1.address);
            const numberOfCons = await cryptoTopTen.NumberOfActiveConstituents();
            expect(numberOfCons).to.equal(2);
        })
        it('Accepting deposit check', async function(){
            // await cryptoTopTen.RemoveConstituent(mockToken1.address);
            const acceptingdeposit = await cryptoTopTen.AcceptingDeposit(mockToken1.address);
            expect(acceptingdeposit).to.equal(true);
        })
        it('Divisor check', async function(){
            const divisor = await cryptoTopTen.Divisor();
            expect(divisor).to.equal(1);
        })
        it('Token price check', async function(){
            const divisor = await cryptoTopTen.TokenPrice();
            expect(divisor).to.equal(1000);
        })
        it('Make deposit check', async function(){
            await mockToken1.connect(addr1).approve(cryptoTopTen.address, '1000000000000000000');
            await cryptoTopTen.connect(addr1).MakeDeposit(mockToken1.address, '1000000000000000000');
            const MT1balance = await mockToken1.balanceOf(cryptoTopTen.address);
            expect(MT1balance).to.equal('1000000000000000000');
        })
        // it('Make deposit check', async function(){
        //     const shares = await cryptoTopTen.MakeDeposit(mockToken1.address, 1000);
        //     console.log('shares received from 100 mock token1: ', shares );
        // })
    })

});