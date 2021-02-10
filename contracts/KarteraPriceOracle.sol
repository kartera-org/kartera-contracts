// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract KarteraPriceOracle {

    // map of token to chainlink price address
    mapping (address => TokenPriceMap) tokenCLMap;
    address owner;
    uint currencydecimals = 1000000;

    //
    struct TokenPriceMap {
        address[] addrLink;
        uint8 length;
    }
    
    constructor() public {
       owner = msg.sender;
    }

    function addToken(address tokenaddress, uint8 len, address[] calldata claddress) external {
        require(msg.sender == owner, 'Only owner can add new tokens');
        tokenCLMap[tokenaddress].addrLink = claddress;
        tokenCLMap[tokenaddress].length = len;
    }

    function price(address tknaddress) view public returns (uint256, uint8) {
        uint256 prc = 1;
        uint8 decimals = 0;
        for(uint8 i=0; i<tokenCLMap[tknaddress].length; i++){
            (int clprc, uint8 decs) = clPrice(tokenCLMap[tknaddress].addrLink[i]);
            prc = SafeMath.mul(prc, uint256(clprc));
            decimals += decs;
        }
        return (prc, decimals);
    }

    function clPrice(address addr) public view returns (int, uint8) {
        // return (1000000000000000000, 18); //for localhost testing
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
