// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";

contract KarteraPriceOracle is IPriceOracle{

    using SafeMath for uint256;

    // map of token to chainlink price address
    mapping (address => TokenPriceMap) tokenMap;
    address owner;
    uint8 defDecimals = 18;

    struct TokenPriceMap {
        address[] uniPairs;
        bool[] invert;
        uint uniPairLen;
        uint8 fixDecimals;
        address[] addrLink;
        uint8 length;
    }
    
    constructor() public {
       owner = msg.sender;
    }

    function addToken(address tokenaddress, uint8 len, address[] calldata claddress) external virtual {
        require(msg.sender == owner, 'Only owner can add new tokens');
        tokenMap[tokenaddress].addrLink = claddress;
        tokenMap[tokenaddress].length = len;
    }

    function addUniPairs(address tokenaddress, uint8 len, address[] calldata pairaddress, bool[] calldata invert, uint8 fixDecimals) external virtual returns (bool) {
        require(msg.sender == owner, 'Only owner can add new tokens');
        require(len>0, 'incorrect token path');
        tokenMap[tokenaddress].uniPairs = pairaddress;
        tokenMap[tokenaddress].invert = invert;
        tokenMap[tokenaddress].uniPairLen = len;
        tokenMap[tokenaddress].fixDecimals = fixDecimals;
    }

    function clPrice(address tknaddress) public view returns (uint256, uint8, uint) {
        uint256 prc = 1;
        uint8 decimals = 0;
        uint timeStamp=block.timestamp;
        for(uint8 i=0; i<tokenMap[tknaddress].length; i++){
            (int clprc, uint8 decs, uint timestamp) = clAggPrice(tokenMap[tknaddress].addrLink[i]);
            prc = SafeMath.mul(prc, uint256(clprc));
            decimals += decs;
            if(timestamp<timeStamp){
                timeStamp = timestamp;
            }
        }
        return (prc, decimals, timeStamp);
    }

    function getReserves(address pair_, bool invert) public view returns (uint256 reserveA, uint256 reserveB) {
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair_).getReserves();
        (reserveA, reserveB) = invert ? (reserve1, reserve0) : (reserve0, reserve1);
    }

    function uniPrice(address tknaddress) public view returns (uint256, uint8) {
        require(tokenMap[tknaddress].uniPairLen>0, 'Token pricing pair does not exist');
        uint256 prc = power(10, defDecimals+tokenMap[tknaddress].fixDecimals);
        for(uint8 i=0; i<tokenMap[tknaddress].uniPairLen; i++){
            (uint256 reserveA, uint256 reserveB) = getReserves(tokenMap[tknaddress].uniPairs[i], tokenMap[tknaddress].invert[i]);

            prc = prc.mul(reserveB).div(reserveA);
        }
        return (prc, defDecimals);
    }

    function price(address addr) view external override returns (uint256 , uint8) {
        if(tokenMap[addr].uniPairLen>0 && tokenMap[addr].length>0){
            return aggPrice(addr);
        }
        if(tokenMap[addr].uniPairLen>0){
            return uniPrice(addr);
        }
        if(tokenMap[addr].length>0){
            (uint256 clprc, uint8 cldec, uint timestamp) = clPrice(addr);
            return (clprc, cldec);
        }
        require(false, 'price for token not available');
    }

    function aggPrice(address addr) internal view returns (uint256, uint8) {
        (uint256 clprc, uint8 cldec, uint timestamp) = clPrice(addr);
        (uint256 uniprc, uint8 unidec) = uniPrice(addr);
        uint256 tsDiff = 1;
        if(timestamp>0 && timestamp<block.timestamp){
            tsDiff = block.timestamp.sub(timestamp);
        }
        uint256 prc = clprc.mul(power(10, 18)).div(power(10, cldec)) + uniprc.mul(tsDiff);
        prc = prc.div(tsDiff+1);
        return (prc, 18);
    }

    function clAggPrice(address addr) internal view returns (int, uint8, uint) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(addr);
        (
            uint80 roundID, 
            int prc,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        // require(timeStamp > 0, "Round not complete");
        uint8 decimals = priceFeed.decimals();
        return (prc, decimals, timeStamp);
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}
