import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { CLPriceFeed__factory, CLPriceFeed } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

chai.use(solidity);
const { expect } = chai;

function tokens(n: string) {
  return ethers.utils.parseUnits(n, "ether");
}

let provider = ethers.getDefaultProvider();

describe("CLPriceFeed Token", function () {
  let PriceToken: CLPriceFeed__factory;
  let priceToken: CLPriceFeed;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  before(async function () {
    // Get the ContractFactory and Signers here.
    PriceToken = (await ethers.getContractFactory(
      "CLPriceFeed"
    )) as CLPriceFeed__factory;

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    priceToken = await PriceToken.deploy();
  });

    describe("Deployment", function () {
        it("Kartera token has the right owner", async function () {
            expect(await priceToken.owner()).to.equal(owner.address);
        });
    });

    describe("CL Price Feed", function () {
        it("Received CL Price Feed", async function () {
             let price = await priceToken.getLatestPrice();
             console.log(price);
        })
    })
});

