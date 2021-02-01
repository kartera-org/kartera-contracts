// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";
import "./KarteraToken.sol";

contract DefiBasket is ERC20("Kartera Defi Basket", "kDEFI"), Ownable, ERC20Burnable {
    address internal incentiveToken;
    uint256 internal incentiveMultiplier;
    address internal manager;
    uint8 internal numberOfConstituents = 0;
    uint internal initialBasketValue = 1000;
    mapping (address => Constituent) internal constituents;
    mapping (uint8 => address) internal constituentAddress;
    address internal currencyAddress = 	0x9326BFA02ADD2366b30bacB125260Af641031331;
    uint256 internal currencyDecimal = 100000000;
    uint256 internal feeFactor = 1000; //0.1%
    uint8 internal totalWeight = 0;
    uint256 internal depositThreshold =  100000000000000;
    struct Constituent{
        address constituentAddress;
        address clPriceAddress;
        uint8 weight;
        uint8 weightTolerance;
        uint8 id;
        bool active;
        uint256 totalDeposit;
    }

    constructor() public {
        manager = msg.sender;
        incentiveToken = address(0);
    }
    
    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    modifier onlyManagerOrOwner() {
        require(msg.sender == manager || msg.sender == owner());
        _;
    }

    function transferManager(address newmanager) external onlyManager {
        manager = newmanager;
    }

    function setIncentiveToken(address incentivetoken, uint256 multiplier) external onlyManagerOrOwner {
        incentiveToken = incentivetoken;
        incentiveMultiplier = multiplier;
    }

    function setIncentiveMultiplier(address incentivetoken) external onlyManagerOrOwner {
        incentiveToken = incentivetoken;
    }

    function addConstituent(address conaddr, uint8 weight, uint8 weighttol, address clPriceAddress) external onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress != conaddr || !constituents[conaddr].active, "Constituent already exists and is active");
        require( totalWeight - constituents[conaddr].weight + weight <= 100, 'Total Weight Exceeds 100%');
        constituents[conaddr].constituentAddress = conaddr;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weighttol;
        constituents[conaddr].clPriceAddress = clPriceAddress;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].id = numberOfConstituents;
        constituentAddress[numberOfConstituents] = conaddr;
        totalWeight += weight;
        numberOfConstituents++;
    }

    function removeConstituent(address conaddr) public onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        totalWeight -= constituents[conaddr].weight;
        constituents[conaddr].active = false;
    }

    function updateConstituent(address conaddr, uint8 weight, uint8 weightTolerance) external onlyManagerOrOwner returns (bool) {

        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( totalWeight - constituents[conaddr].weight + weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight = totalWeight - constituents[conaddr].weight + weight;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weightTolerance;
        return true;
    }

    function makeDeposit(address conaddr, uint256 numberoftokens) external payable returns (uint256){
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( constituents[conaddr].active, "Constituent is not active");
        bool acceptingDeposits = acceptingDeposit(conaddr);
        require(acceptingDeposits, "No further deposits accepeted for this contract");
        uint256 amount = numberoftokens * constituentPrice(conaddr);
        uint256 minttokens = tokensForDeposit(amount);
        ERC20 token = ERC20(conaddr);
        token.transferFrom(msg.sender, address(this), numberoftokens);
        _mint(msg.sender, minttokens);
        constituents[conaddr].totalDeposit += numberoftokens;

        uint256 incentivesOffered = incentive(SafeMath.div(amount, currencyDecimal).div(power(10, decimals())));
        if(incentivesOffered>0){
            ERC20 incentivetkn = ERC20(incentiveToken);
            incentivetkn.transfer(msg.sender, incentivesOffered);
        }

        return numberoftokens;
    }

    function withdrawComponent(address conaddr, uint256 numberoftokens) external payable {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(!constituents[conaddr].active, "Cannot withdraw from active constituent");
        uint256 amount = depositsForTokens(conaddr, numberoftokens);
        ERC20 token = ERC20(conaddr);
        token.transfer(msg.sender, amount);
        _burn(msg.sender, numberoftokens);
        constituents[conaddr].totalDeposit -= amount;
    }
    
    function updateDepositThreshold(uint256 depositthreshold) external onlyManager {
        depositThreshold = depositthreshold;
    }

    function updateFeeFactor(uint256 feefactor) external onlyOwner {
        feeFactor = feefactor;
    }

    function collectFees() external onlyOwner {
        uint256 feeAllocation = SafeMath.div(totalSupply(), feeFactor);
        _mint(owner(), feeAllocation);
    }

    function getConstituentAddress(uint8 indx) public view returns (address) {
        require(indx < numberOfAllConstituents(), "Index exceeds array size");
        return constituentAddress[indx];
    }

    function getConstituentDetails(address conaddr) public view returns (address, address, uint8, uint8, bool, uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        return (constituents[conaddr].constituentAddress,
                constituents[conaddr].clPriceAddress,
                constituents[conaddr].weight,
                constituents[conaddr].weightTolerance,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit);
    }

    function numberOfAllConstituents() public view returns (uint) {
        return numberOfConstituents;
    }

    function numberOfActiveConstituents() public view returns (uint) {
        uint activecons = 0;
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
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
        uint256 conprice = SafeMath.mul(uint256(curprice), uint256(price)).div(power(10, priceFeed.decimals()));
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
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
            totaldeposit += SafeMath.mul(constituentPrice(addr), constituents[addr].totalDeposit);
        }
        return totaldeposit;
    }

    function tokenPrice() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > 0) {
            return SafeMath.div(totalDeposit(), totalSupply());
        }
        return SafeMath.mul(initialBasketValue, currencyDecimal);
    }

    function exchangneRate(address conaddr) public view returns (uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        uint256 amount = SafeMath.mul(constituentPrice(conaddr), power(10, decimals()));
        uint256 tokens = tokensForDeposit(amount);
        return tokens;
    }

    function tokensForDeposit(uint amount) public view returns (uint256) {
        return SafeMath.div(amount, tokenPrice());
    }

    function depositsForTokens(address conaddr, uint numberoftokens) public view returns (uint256) {
        return SafeMath.mul(numberoftokens, tokenPrice()).div(constituentPrice(conaddr));
    }

    function acceptingDeposit(address conaddr) public view returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        uint currentweight = 0;
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit>0 && totaldeposit > depositThreshold){
            currentweight = SafeMath.mul(100, constituents[conaddr].totalDeposit).mul(constituentPrice(conaddr)).div(totaldeposit);
        }else{
            return true;
        }
        if (currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    function getFeeFactor() public view returns (uint256) {
        return feeFactor;
    }

    function getManager() public view returns (address) {
        return manager;
    }

    function incentive(uint256 dollaramount) public view returns (uint256) {
        if(incentiveToken == address(0)){
            return 0;
        }
        ERC20 token = ERC20(incentiveToken);
        uint256 karterasupply = token.balanceOf(address(this));
        uint256 d = SafeMath.mul(incentiveMultiplier, dollaramount);
        if(karterasupply >= d){
            return d;
        }
        return 0;
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}