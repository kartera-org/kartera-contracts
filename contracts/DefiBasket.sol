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
import "./KarteraPriceOracle.sol";

/// @title DefiBasket 
contract DefiBasket is ERC20("Kartera Defi Basket", "kDEFI"), Ownable, ERC20Burnable {

    // address of manager of the basket 
    address internal manager;

    // price at which first token is issued
    uint internal initialBasketValue = 100;

    // total number of constituents in the basket 
    uint8 internal numberOfConstituents = 0;

    // map of constituents by address
    mapping (address => Constituent) internal constituents;

    // map of constituent address by index
    mapping (uint8 => address) internal constituentAddress;

    // price oracle contract
    KarteraPriceOracle karteraPriceOracle;

    // total weight 
    uint8 internal totalWeight = 0;

    // parameter overrides weight of each constituent until $1m
    uint256 internal depositThreshold =  1000000000000000000000000;

    // address of governance token offered as incentive kart token address
    address internal governanceToken;

    // $1 to # of kartera tokens offered
    uint256 internal incentiveMultiplier;
    
    // $1 to # of kartera tokens offered
    uint256 internal withdrawIncentiveMultiplier;

    uint256 internal withdrawCostMultiplier;
    /** 
        constituentAddress: constituent address
        clPriceAddress: chain link contract address
        weight: weight of the constituent
        id: index of the constituent
        active: true => part of the basket on deposits can be made, false => removed from basket only withdrawals can be made
        totalDeposit: # of tokens deposited in the basket
        decimals: decimals of constituent token
    */

    struct Constituent{
        address constituentAddress;
        uint8 weight;
        uint8 weightTolerance;
        uint8 id;
        bool active;
        uint256 totalDeposit;
        uint8 decimals;
    }

    /// @notice contract constructor make sender the manger and sets governance token to zero address
    constructor() public {
        manager = msg.sender;
        governanceToken = address(0);
    }

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    modifier onlyManagerOrOwner() {
        require(msg.sender == manager || msg.sender == owner());
        _;
    }

    /// @notice transfer manager
    function transferManager(address newmanager) external onlyManagerOrOwner {
        manager = newmanager;
    }

    /// @notice set governance token incentive multiplier
    function setGovernanceToken(address token_, uint256 multiplier) external onlyManagerOrOwner {
        governanceToken = token_;
        incentiveMultiplier = multiplier;
    }

    /// @notice mint additional tokens by basket
    function mint(address _to, uint256 _amount) external onlyOwner{
        _mint(_to, _amount);
    }

    /// @notice modify incentive multiplier
    function setIncentiveMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        incentiveMultiplier = multiplier;
    }

    /// @notice modify withdraw incentive multiplier
    function setWithdrawIncentiveMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        require(governanceToken != address(0), 'Governance token not set');
        withdrawIncentiveMultiplier = multiplier;
    }

    /// @notice set/modify active constituent withdraw cost multiplier
    function setWithdrawCostMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        require(governanceToken != address(0), 'Governance token not set');
        withdrawCostMultiplier = multiplier;
    }

    /// @notice price oracle address
    function setPriceOracleAddress(address priceoracleAddr) external onlyManagerOrOwner {
        karteraPriceOracle = KarteraPriceOracle(priceoracleAddr);
    }

    /// @notice add constituent to a basket
    function addConstituent(address conaddr, uint8 weight, uint8 weighttol) external onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress != conaddr , "Constituent already exists");
        require( totalWeight + weight <= 100, 'Total Weight Exceeds 100%');
        constituents[conaddr].constituentAddress = conaddr;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weighttol;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].id = numberOfConstituents;

        ERC20 token = ERC20(conaddr);
        constituents[conaddr].decimals = token.decimals();

        constituentAddress[numberOfConstituents] = conaddr;
        totalWeight += weight;
        numberOfConstituents++;
    }

    // @notice activate constituent
    function activateConstituent(address conaddr) external onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress == conaddr , "Constituent does not exists");
        require(totalWeight + constituents[conaddr].weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight += constituents[conaddr].weight;
        constituents[conaddr].active = true;
    }

    /// @notice remove constituent
    function removeConstituent(address conaddr) public onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        totalWeight -= constituents[conaddr].weight;
        constituents[conaddr].active = false;
    }

    /// @notice update constituent changes weight and weight tolerance after rebalancing to manager constituent weight close to desired
    function updateConstituent(address conaddr, uint8 weight, uint8 weightTolerance) external onlyManagerOrOwner returns (bool) {

        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( totalWeight - constituents[conaddr].weight + weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight = totalWeight - constituents[conaddr].weight + weight;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weightTolerance;
        return true;
    }

    /// @notice external call to depoit tokens to basket and receive equivalent basket tokens
    function makeDeposit(address conaddr, uint256 numberoftokens) external payable returns (uint256, uint256){
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( constituents[conaddr].active, "Constituent is not active");
        bool acceptingDeposits = acceptingDeposit(conaddr);
        require(acceptingDeposits, "No further deposits accepeted for this contract");
        (uint256 prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(numberoftokens, prc).div(power(10, decs));
        uint256 minttokens = tokensForDeposit(amount);
        ERC20 token = ERC20(conaddr);
        token.transferFrom(msg.sender, address(this), numberoftokens);
        _mint(msg.sender, minttokens);
        constituents[conaddr].totalDeposit += numberoftokens;

        uint256 incentivesOffered = incentive(SafeMath.div(amount, power(10, decimals())));
        if(incentivesOffered>0){
            ERC20 tkn = ERC20(governanceToken);
            tkn.transfer(msg.sender, incentivesOffered);
        }

        return (minttokens, incentivesOffered);
    }

    /// @notice transfer tokens
    function transferTokens(address conaddr, address to, uint amount) external onlyOwner {
        require(constituents[conaddr].constituentAddress == conaddr && !constituents[conaddr].active, "Constituent does not exist or is active");
        ERC20 token = ERC20(conaddr);
        token.transfer(to, amount);
    }

    /// @notice exchange basket tokens for removed constituent tokens
    function withdrawInactive(address conaddr, uint256 numberoftokens) external payable returns(uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(!constituents[conaddr].active, "Cannot withdraw from active constituent");
        uint256 tokenprice = tokenPrice();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice).div(power(10, decimals()));
        uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);
        ERC20 token = ERC20(conaddr);
        token.transfer(msg.sender, tokensredeemed);
        _burn(msg.sender, numberoftokens);
        constituents[conaddr].totalDeposit -= tokensredeemed;
        uint256 incentivesOffered = withdrawIncentive(SafeMath.div(dollaramount, power(10, decimals())));
        if(incentivesOffered>0){
            ERC20 tkn = ERC20(governanceToken);
            tkn.transfer(msg.sender, incentivesOffered);
        }
        return incentivesOffered;
    }

    /// @notice exchange basket tokens for active constituent tokens
    function withdrawActive(address conaddr, uint256 numberoftokens) external payable returns(uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(constituents[conaddr].active, "Constituent is inactive");
        uint256 tokenprice = tokenPrice();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        uint256 withdrawcost = withdrawCost(SafeMath.div(dollaramount, power(10, decimals()))).div(power(10, decimals()));
        ERC20 tkn = ERC20(governanceToken);
        tkn.transferFrom(msg.sender, address(this), withdrawcost);

        dollaramount = SafeMath.div(dollaramount, power(10, decimals()));
        uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);
        ERC20 token = ERC20(conaddr);
        token.transfer(msg.sender, tokensredeemed);
        _burn(msg.sender, numberoftokens);
        constituents[conaddr].totalDeposit -= tokensredeemed;
    }
    
    /// @notice update deposit threshold
    function updateDepositThreshold(uint256 depositthreshold) external onlyManagerOrOwner {
        depositThreshold = depositthreshold;
    }

    /// @notice get constituent address from index
    function getConstituentAddress(uint8 indx) public view returns (address) {
        require(indx < numberOfAllConstituents(), "Index exceeds array size");
        return constituentAddress[indx];
    }

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) public view returns (address, uint8, uint8, bool, uint256, uint8) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        return (constituents[conaddr].constituentAddress,
                constituents[conaddr].weight,
                constituents[conaddr].weightTolerance,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit,
                constituents[conaddr].decimals);
    }

    /// @notice get all constituents including active and inactive
    function constituentStatus(address conaddr) public view returns (bool) {
        return constituents[conaddr].active;
    }

    /// @notice get all constituents including active and inactive
    function numberOfAllConstituents() public view returns (uint) {
        return numberOfConstituents;
    }

    /// @notice get only # of active constituents
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

    function constituentPrice(address conaddr) public view returns (uint256, uint8) {
        (uint256 prc, uint8 decimals) = karteraPriceOracle.price(conaddr);
        return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() public view returns(uint256) {
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
            (uint prc, uint8 decs) = constituentPrice(addr);
            totaldeposit += SafeMath.mul(prc, constituents[addr].totalDeposit).div(power(10, decs));
        }
        return totaldeposit;
    }

    /// @notice get price of one token of the basket
    function tokenPrice() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > 0) {
            return SafeMath.mul(totaldeposit, power(10, decimals())).div(totalSupply());
        }
        return SafeMath.mul(initialBasketValue, power(10, decimals()));
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) public view returns (uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(prc, power(10, decimals())).div(power(10, decs));
        uint256 tokens = tokensForDeposit(amount);
        return tokens;
    }

    /// @notice # of basket tokens for deposit $ amount 
    function tokensForDeposit(uint amount) public view returns (uint256) {
        return SafeMath.mul(amount, power(10, decimals())).div(tokenPrice());
    }

    /// @notice number of inactive constituent tokens for 1 basket token
    function depositsForTokens(address conaddr, uint numberoftokens) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        return SafeMath.mul(numberoftokens, tokenPrice()).mul(power(10, decs)).div(prc);
    }

    /// @notice number of inactive constituent tokens for dollar amount 
    function depositsForDollar(address conaddr, uint256 dollaramount) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        return SafeMath.mul(dollaramount, power(10, decs)).div(prc);
    }
        
    /// @notice number of incentive tokens required to withdraw constituent
    function constituentWithdrawCost(uint256 numberoftokens) public view returns (uint256){
        uint256 tokenprice = tokenPrice();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        uint256 withdrawcost = withdrawCost(SafeMath.div(dollaramount, power(10, decimals()))).div(power(10, decimals()));
        return withdrawcost;
    }

    /// @notice if deposits can be made for a constituents
    function acceptingDeposit(address conaddr) public view returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        uint currentweight = 0;
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > depositThreshold){
            (uint256 prc, uint8 decs) = constituentPrice(conaddr);
            currentweight = SafeMath.mul(100, constituents[conaddr].totalDeposit).mul(prc).div(totaldeposit).div(power(10, decs));
        }else{
            return true;
        }
        if (currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    /// @notice get manager address
    function getManager() public view returns (address) {
        return manager;
    }

    /// @notice get governance token address
    function getGovernanceTokenAddress() public view returns (address) {
        return governanceToken;
    }

    /// @notice get number of incentive tokens for $ deposit
    function incentive(uint256 dollaramount) public view returns (uint256) {
        if(governanceToken == address(0)){
            return 0;
        }
        ERC20 token = ERC20(governanceToken);
        uint256 karterasupply = token.balanceOf(address(this));
        uint256 d = SafeMath.mul(incentiveMultiplier, dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    /// @notice get number of incentive tokens for $ withdrawn
    function withdrawIncentive(uint256 dollaramount) public view returns (uint256) {
        if(governanceToken == address(0)){
            return 0;
        }
        ERC20 token = ERC20(governanceToken);
        uint256 karterasupply = token.balanceOf(address(this));
        uint256 d = SafeMath.mul(withdrawIncentiveMultiplier, dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    /// @notice get number of tokens to depost inorder to withdraw from active constituent
    function withdrawCost(uint256 longdollaramount) public view returns (uint256) {
        require(governanceToken != address(0), 'cannot withdraw');
        uint256 d = SafeMath.mul(withdrawCostMultiplier, longdollaramount);
        return d;
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}
