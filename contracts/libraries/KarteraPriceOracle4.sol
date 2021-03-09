// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";

contract KarteraPriceOracle4 is IPriceOracle{

    address owner;
    address factoryAddr;
    IUniswapV2Factory uniFactory;
    uint8 decimals = 18;
    mapping (address => TokenLinks) public tokenLinks;
    struct TokenLinks {
        address[] uniPairs;
        bool[] invert;
        uint uniPairLen;
        address[] clLinks;
        uint8 clLinkLen;
    }
    constructor(address factoryAddr_) public {
        owner = msg.sender;
        factoryAddr = factoryAddr_;
        uniFactory = IUniswapV2Factory(factoryAddr_);
    }

    function addUniPairs(address tokenaddress, uint8 len, address[] calldata pairaddress, bool[] calldata invert) external virtual returns (bool) {
        require(msg.sender == owner, 'Only owner can add new tokens');
        require(len>0, 'incorrect token path');
        tokenLinks[tokenaddress].uniPairs = pairaddress;
        tokenLinks[tokenaddress].invert = invert;
        tokenLinks[tokenaddress].uniPairLen = len;
    }

    // function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair, bool invert) {
    //     (address token0, address token1) = sortTokens(tokenA, tokenB);
    //     pair = address(uint(keccak256(abi.encodePacked(
    //             hex'ff',
    //             factory,
    //             keccak256(abi.encodePacked(token0, token1)),
    //             hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
    //         ))));
    //     invert = true;
    //     if(token0==tokenA){
    //         invert = false;
    //     }
    //     return (pair, invert);
    // }

    // function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
    //     require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
    //     (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    //     require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    // }

    function getReserves(address pair_, bool invert) internal view returns (uint reserveA, uint reserveB) {
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair_).getReserves();
        (reserveA, reserveB) = !invert ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function price(address tknaddress) external view virtual override returns (uint256, uint8) {
        require(tokenLinks[tknaddress].uniPairLen>0, 'Token pricing pair does not exist');
        uint256 prc = power(10, decimals);
        for(uint8 i=0; i<tokenLinks[tknaddress].uniPairLen; i++){
            (uint reserveA, uint reserveB) = getReserves(tokenLinks[tknaddress].uniPairs[i], tokenLinks[tknaddress].invert[i]);

            prc = SafeMath.mul(prc, reserveB);
            prc = SafeMath.div(prc, reserveA);
        }
        return (prc, decimals);
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}
