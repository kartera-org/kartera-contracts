// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";

contract KarteraPriceOracle2 is IPriceOracle{

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

    function price(address tknaddress) external view virtual override returns (uint256, uint8) {
        uint256 prc = 1;
        uint8 decimals = 0;
        for(uint8 i=0; i<tokenMap[tknaddress].length; i++){
            (int clprc, uint8 decs) = clPrice(tokenMap[tknaddress].addrLink[i]);
            prc = SafeMath.mul(prc, uint256(clprc));
            decimals += decs;
        }
        return (prc, decimals);
    }

    function clPrice(address addr) public view virtual returns (int, uint8) {
        // return (2000000000000000000, 20); //for localhost testing
        AggregatorV3Interface priceFeed = AggregatorV3Interface(addr);
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        require(timeStamp > 0, "Round not complete");
        uint8 decimals = priceFeed.decimals();
        return (price, decimals);
    }

}
