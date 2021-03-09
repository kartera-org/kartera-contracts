// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "../interfaces/IPriceOracle.sol";

interface IStdReference {
    /// A structure returned whenever someone requests for standard reference data.
    struct ReferenceData {
        uint256 rate; // base/quote exchange rate, multiplied by 1e18.
        uint256 lastUpdatedBase; // UNIX epoch of the last time when base price gets updated.
        uint256 lastUpdatedQuote; // UNIX epoch of the last time when quote price gets updated.
    }

    /// Returns the price data for the given base/quote pair. Revert if not available.
    function getReferenceData(string memory _base, string memory _quote)
        external
        view
        returns (ReferenceData memory);

    /// Similar to getReferenceData, but with multiple base/quote pairs at once.
    function getReferenceDataBulk(string[] memory _bases, string[] memory _quotes)
        external
        view
        returns (ReferenceData[] memory);
}

contract KarteraPriceOracle3 is IPriceOracle{

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

    IStdReference ref;
    mapping (address => string) public baseSymbols;
    mapping (address => string) public quoteSymbols;
    
    constructor(address refAddr) public {
        owner = msg.sender;
        ref = IStdReference(refAddr);
    }

    function addBandToken(address tokenaddress, string memory baseSymbol, string memory quoteSymbol) external {
        baseSymbols[tokenaddress] = baseSymbol;
        quoteSymbols[tokenaddress] = quoteSymbol;
    }

    function price(address tknaddress) external view virtual override returns (uint256, uint8) {
        uint8 decimals = 18;
        
        IStdReference.ReferenceData memory data = ref.getReferenceData(baseSymbols[tknaddress],quoteSymbols[tknaddress]);
        return (data.rate, decimals);

    }

    function clPrice(address addr) public view returns (int, uint8) {
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
