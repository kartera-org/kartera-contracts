import { ethers } from "hardhat";
import chai from "chai";
const { expect, assert } = chai;

const etherCLAddr = '0x9326BFA02ADD2366b30bacB125260Af641031331';
const mockAaveAddr = '0xefF313696D5513Ab2d7763a967a64d26B0fBB793';
const mockUniAddr = '0x32Bd516d7C5cdD918477632558C01aF2663f3F69';
const karteraPriceOracleAddr = '0x293b6D22E5774c9615E2fb1D3C18B4E36B61C5e8'

describe('Kartera Price Oracle', () => {

    before(async function () {
        // Get the ContractFactory and Signers here.
    
        [this.alice, this.bob, this.carol, ...this.others] = await ethers.getSigners();
        this.KarteraPriceOracle = await ethers.getContractFactory("KarteraPriceOracle");
        this.karteraPriceOracle = await this.KarteraPriceOracle.deploy();
        let link = ['0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad', etherCLAddr];
        await this.karteraPriceOracle.addToken(mockAaveAddr, 2, link);
        link = ['0x17756515f112429471F86f98D5052aCB6C47f6ee', etherCLAddr];
        await this.karteraPriceOracle.addToken(mockUniAddr, 2, link);

        console.log('karteraPriceOracle address: ', this.karteraPriceOracle.address );
    })

    it('should get price', async function() {
        // let prc = await this.karteraPriceOracle.Price(mockAaveAddr);
        // console.log('aave prc: ', prc.toString() );

        // prc = await this.karteraPriceOracle.Price(mockUniAddr);
        // console.log('Uni prc: ', prc.toString() );
    })

})
