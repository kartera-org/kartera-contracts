import { ethers } from "hardhat";
import { CLPriceFeed__factory, CLPriceFeed } from "../typechain";
import { CryptoTopTen__factory, CryptoTopTen } from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

function tokens(n: string) {
  return ethers.utils.parseUnits(n, "ether");
}

// const clPriceFeedContract = "0x52480065b0AB39117F737E61AeD44D5E1B0005DE";
// const txid = "0x3ca398665516d402c0d7f07d8a050f7de42152324434038516cb06ce4771fc57";
const cryptoTopTenAddr = "0x324048a600DE0Cb831ef359E15c671c113f9255c";
const cryptoTopTenTXID = "0x63a0eb4717452a0b9e1156bfe3e08b874d1bfb38bb0d0a2321c20d5a177ecfdf";
const addresses = [
    // {name:"AAVEETH", addr:"0xd04647B7CB523bb9f26730E9B6dE1174db7591Ad"},
    // {name:"AMPLETH", addr:"0x562C092bEb3a6DF77aDf0BB604F52c018E4f2814"},
    {name:"AUDUSD", addr:"0x5813A90f826e16dB392abd2aF7966313fc1fd5B8"},
    // {name:"BATETH", addr:"0x0e4fcEC26c9f85c3D714370c98f43C4E02Fc35Ae"},
    {name:"BATUSD", addr:"0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219"},
    {name:"BNBUSD", addr:"0x8993ED705cdf5e84D0a3B754b5Ee0e1783fcdF16"},
    // {name:"BTCETH", addr:"0xF7904a295A029a3aBDFFB6F12755974a958C7C25"},
    {name:"BTCUSD", addr:"0x6135b13325bfC4B00278B4abC5e20bbce2D6580e"},
    // {name:"BUSDETH", addr:"0xbF7A18ea5DE0501f7559144e702b29c55b055CcB"},
    // {name:"BZRXETH", addr:"0x9aa9da35DC44F93D90436BfE256f465f720c3Ae5"},
    {name:"CHFUSD", addr:"0xed0616BeF04D374969f302a34AE4A63882490A8C"},
    // {name:"DAIETH", addr:"0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541"},
    {name:"DAIUSD", addr:"0x777A68032a88E5A84678A77Af2CD65A7b3c0775a"},
    // {name:"ENJETH", addr:"0xfaDbe2ee798889F02d1d39eDaD98Eff4c7fe95D4"},
    {name:"ETHUSD", addr:"0x9326BFA02ADD2366b30bacB125260Af641031331"},
    {name:"EURUSD", addr:"0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13"},
    {name:"GBPUSD", addr:"0x28b0061f44E6A9780224AA61BEc8C3Fcb0d37de9"},
    {name:"JPYUSD", addr:"0xD627B1eF3AC23F1d3e576FA6206126F3c1Bd0942"},
    // {name:"KNCETH", addr:"0xb8E8130d244CFd13a75D6B9Aee029B1C33c808A7"},
    // {name:"LINKETH", addr:"0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38"},
    {name:"LINKUSD", addr:"0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0"},
    {name:"LTCUSD", addr:"0xCeE03CF92C7fFC1Bad8EAA572d69a4b61b6D4640"},
    // {name:"MANAETH", addr:"0x1b93D8E109cfeDcBb3Cc74eD761DE286d5771511"},
    // {name:"MKRETH", addr:"0x0B156192e04bAD92B6C1C13cf8739d14D78D5701"},
    {name:"ORNUSDT", addr:"0x66413F734E69C2C41B4902024D0C5C3A86b8EcD2"},
    {name:"OilUSD", addr:"0x48c9FF5bFD7D12e3C511022A6E54fB1c5b8DC3Ea"},
    // {name:"RENETH", addr:"0xF1939BECE7708382b5fb5e559f630CB8B39a10ee"},
    // {name:"REPETH", addr:"0x3A7e6117F2979EFf81855de32819FBba48a63e9e"},
    // {name:"SNXETH", addr:"0xF9A76ae7a1075Fe7d646b06fF05Bd48b9FA5582e"},
    {name:"SNXUSD", addr:"0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD"},
    // {name:"SUSDETH", addr:"0xb343e7a1aF578FA35632435243D814e7497622f7"},
    {name:"TRXUSD", addr:"0x9477f0E5bfABaf253eacEE3beE3ccF08b46cc79c"},
    // {name:"TUSDETH", addr:"0x7aeCF1c19661d12E962b69eBC8f6b2E63a55C660"},
    // {name:"UNIETH", addr:"0x17756515f112429471F86f98D5052aCB6C47f6ee"},
    // {name:"USDCETH", addr:"0x64EaC61A2DFda2c3Fa04eED49AA33D021AeC8838"},
    // {name:"USDTETH", addr:"0x0bF499444525a23E7Bb61997539725cA2e928138"},
    {name:"XAGUSD", addr:"0x4594051c018Ac096222b5077C3351d523F93a963"},
    {name:"XAUUSD", addr:"0xc8fb5684f2707C82f28595dEaC017Bfdf44EE9c5"},
    {name:"XRPUSD", addr:"0x3eA2b7e3ed9EA9120c3d6699240d1ff2184AC8b3"},
    {name:"XTZUSD", addr:"0xC6F39246494F25BbCb0A8018796890037Cb5980C"},
    // {name:"YFIETH", addr:"0xC5d1B1DEb2992738C0273408ac43e1e906086B6C"},
    // {name:"ZRXETH", addr:"0xBc3f28Ccc21E9b5856E81E6372aFf57307E2E883"},
    {name:"sCEXUSD", addr:"0xA85646318D20C684f6251097d24A6e74Fe1ED5eB"},
    {name:"sDEFIUSD", addr:"0x70179FB2F3A0a5b7FfB36a235599De440B0922ea"},
];

async function main() {
    const [owner, addr1] = await ethers.getSigners();
    // console.log('owner: ', owner );
    // console.log('addr1: ', addr1 );
    const accounts = await ethers.provider.listAccounts();
    console.log(accounts[0]);
    const CryptoTopTen = (await ethers.getContractFactory("CryptoTopTen")) as CryptoTopTen__factory;
    const cryptoTopTen = await CryptoTopTen.attach(cryptoTopTenAddr);
    for(let i=0; i< addresses.length; i++){
      // let price = await cryptoTopTen.constituentPrice(addresses[i].addr);
      // console.log('CL Price recieved ', price.toString() );
      let decimals = await cryptoTopTen.constituentPriceDecimals(addresses[i].addr);
      console.log('CL decimal of address ', addresses[i].addr, ': ' , decimals.toString() );
      // let priceindecimals = parseInt(price.toString()) / Math.pow(10, decimals);
      // console.log('price in decimals: ', priceindecimals)
    }
  }


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });