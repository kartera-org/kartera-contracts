// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract CryptoTopTen is ERC20("jjffrr", "OKU"), Ownable {
    struct Constituent{
        address contractAddress;
        address clPriceAddress;
        uint8 weight;
        uint8 weightTolerance;
        uint8 id;
        bool active;
        uint256 totalDeposit;
    }
    uint8 _numberOfConstituents = 0;
    uint _initialContractValue = 1000;
    mapping (address => Constituent)  constituents;
    mapping (uint8 => address)  contractAddress;
    address currencyAddress = 	0x9326BFA02ADD2366b30bacB125260Af641031331;
    uint currencyDecimal = 100000000;

    function addConstituent(address conaddr, uint8 weight_, address clPriceAddress_) external onlyOwner {
        require(constituents[conaddr].contractAddress != conaddr || !constituents[conaddr].active, "Contract already exists and is active");
        constituents[conaddr].contractAddress = conaddr;
        constituents[conaddr].weight = weight_;
        constituents[conaddr].clPriceAddress = clPriceAddress_;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].weightTolerance = 100;
        constituents[conaddr].id = _numberOfConstituents;
        contractAddress[_numberOfConstituents] = conaddr;
        _numberOfConstituents++;

    }

    function removeConstituent(address conaddr) public onlyOwner {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].active = false;
    }

    function updateConstituent(address conaddr, uint8 weight_) external onlyOwner {

        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].weight = weight_;
    }

    function makeDeposit(address conaddr, uint256 numberoftokens) external payable {
        bool acceptingDeposits = acceptingDeposit(conaddr);
        require(acceptingDeposits, "No further deposits accepeted for this contract");
        uint256 amount = numberoftokens * constituentPrice(conaddr);
        uint256 minttokens = tokensForDeposit(amount);
        ERC20 token = ERC20(conaddr);
        // token.transferFrom(msg.sender, address(this), numberoftokens);
        _mint(msg.sender, minttokens);
        constituents[conaddr].totalDeposit += numberoftokens;
    }

    function getConstituentAddress(uint8 indx) public view returns (address) {
        require(indx < numberOfConstituents(), "Index exceeds array size");
        return contractAddress[indx];
    }

    function getConstituentDetails(address conaddr) public view returns (address, uint8, uint8, bool, uint256) {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        return (constituents[conaddr].clPriceAddress,
                constituents[conaddr].weight,
                constituents[conaddr].weightTolerance,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit);
    }

    function numberOfConstituents() public view returns (uint) {
        return _numberOfConstituents;
    }

    function numberOfActiveConstituents() public view returns (uint) {
        uint activecons = 0;
        for(uint8 i = 0; i < _numberOfConstituents; i++) {
            address addr = contractAddress[i];
            if (constituents[addr].active) {
                activecons++;
            }
        }
        return activecons;
    }

    function constituentPrice(address addr) public view returns (uint256) {
        int curprice = currencyPrice();
        AggregatorV3Interface priceFeed = AggregatorV3Interface(constituents[addr].clPriceAddress);
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        require(timeStamp > 0, "Round not complete");
        uint256 conprice = uint256(curprice * price) / power(10, priceFeed.decimals());
        return conprice;
    }

    function currencyPrice() public view returns (int) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(currencyAddress);
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        console.log(priceFeed.decimals());
        console.log(roundID );
        require(timeStamp > 0, "Round not complete");
        return price;
    }

    function totalDeposit() public view returns(uint256) {
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < _numberOfConstituents; i++) {
            address addr = contractAddress[i];
            totaldeposit += constituentPrice(addr) * constituents[addr].totalDeposit;
        }
        return totaldeposit;
    }

    function weightTolerance(address conaddr) public view returns(uint) {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        return constituents[conaddr].weightTolerance;
    }

    function constituentWeight(address conaddr) public view returns(uint) {
        return constituents[conaddr].weight;
    }

    function tokenPrice() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > 0) {
            return totalDeposit() / totalSupply();
        }
        return _initialContractValue * currencyDecimal;
    }

    function exchangneRate(address conaddr) public view returns (uint256) {
        if(constituents[conaddr].contractAddress != conaddr || !constituents[conaddr].active){
            return 0;
        }
        uint256 amount = constituentPrice(conaddr) * power(10, decimals());
        uint256 tokens = tokensForDeposit(amount);
        return tokens;
    }

    function tokensForDeposit(uint amount) public view returns (uint256) {
        return amount / tokenPrice();
    }

    function acceptingDeposit(address conaddr) public view returns (bool) {
        require(constituents[conaddr].contractAddress == conaddr && constituents[conaddr].active, "Contract does not exist or is not active");
        uint currentweight = 0;
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit>0) {
            currentweight = constituents[conaddr].totalDeposit / totaldeposit;
        }else{
            return true;
        }
        if (currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}