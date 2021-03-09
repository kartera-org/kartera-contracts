// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";

contract KarteraPriceOracle is IPriceOracle{

    // map of token to chainlink price address
    mapping (address => TokenPriceMap) tokenMap;
    address owner;
    uint8 defDecimals = 18;

    struct TokenPriceMap {
        address[] uniPairs;
        bool[] invert;
        uint uniPairLen;
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

    function addUniPairs(address tokenaddress, uint8 len, address[] calldata pairaddress, bool[] calldata invert) external virtual returns (bool) {
        require(msg.sender == owner, 'Only owner can add new tokens');
        require(len>0, 'incorrect token path');
        tokenMap[tokenaddress].uniPairs = pairaddress;
        tokenMap[tokenaddress].invert = invert;
        tokenMap[tokenaddress].uniPairLen = len;
    }

    function clPrice(address tknaddress) external view virtual returns (uint256, uint8) {
        uint256 prc = 1;
        uint8 decimals = 0;
        for(uint8 i=0; i<tokenMap[tknaddress].length; i++){
            (int clprc, uint8 decs) = clAggPrice(tokenMap[tknaddress].addrLink[i]);
            prc = SafeMath.mul(prc, uint256(clprc));
            decimals += decs;
        }
        return (prc, decimals);
    }

    function getReserves(address pair_, bool invert) internal view returns (uint reserveA, uint reserveB) {
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair_).getReserves();
        (reserveA, reserveB) = !invert ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function uniPrice(address tknaddress) external view virtual returns (uint256, uint8) {
        require(tokenMap[tknaddress].uniPairLen>0, 'Token pricing pair does not exist');
        uint256 prc = power(10, defDecimals);
        for(uint8 i=0; i<tokenMap[tknaddress].uniPairLen; i++){
            (uint reserveA, uint reserveB) = getReserves(tokenMap[tknaddress].uniPairs[i], tokenMap[tknaddress].invert[i]);

            prc = SafeMath.mul(prc, reserveB);
            prc = SafeMath.div(prc, reserveA);
        }
        return (prc, defDecimals);
    }

    function price(address addr) view external virtual override returns (uint256 , uint8) {
        return (1000000000000000000, 18); //for localhost testing
    }

    function clAggPrice(address addr) public view virtual returns (int, uint8) {
        // return (1000000000000000000, 18); //for localhost testing
        AggregatorV3Interface priceFeed = AggregatorV3Interface(addr);
        (
            uint80 roundID, 
            int prc,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        require(timeStamp > 0, "Round not complete");
        uint8 decimals = priceFeed.decimals();
        return (prc, decimals);
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}
