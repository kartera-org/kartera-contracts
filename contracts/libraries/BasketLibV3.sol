// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./BasketLib.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/IBasketLibV3.sol";

/// @title DefiBasket 
contract BasketLibV3 is IBasketLibV3 {
    // address of manager of the library 
    address public manager;

    // ERC basket address
    address public basketaddress;

    // price oracle contract address
    address karteraPriceOracleAddress;
    IPriceOracle karteraPriceOracle;

    // price at which first token is issued
    uint256 public initialBasketValue = 100;

    uint256 public basketDecimals = 1000000000000000000;

    // total number of constituents in the basket 
    uint16 public override numberOfConstituents = 0;

    // total number of active constituents in the basket 
    uint16 public override numberOfActiveConstituents = 0;

    // map of constituents by address
    mapping (address => Constituent) public constituents;

    // map of constituent address by index
    mapping (uint16 => address) public override constituentAddress;
    
    // total weight 
    uint8 internal totalWeight = 0;

    // parameter overrides weight of each constituent until $1m with 18 decimals
    uint256 public override depositThreshold =  1000000000000000000000000;

    // address of governance token offered as incentive kart token address
    address public override governanceToken;

    // $1 to # of kartera tokens offered
    uint256 public override depositIncentiveMultiplier;
    
    // $1 to # of kartera tokens offered
    uint256 public override withdrawIncentiveMultiplier;

    // $1 to # of kartera tokens required to withdraw
    uint256 public override withdrawCostMultiplier;

    uint256 pendingSenderCount = 0;
    mapping (uint256 => address) pendingSenders;
    mapping (address => mapping(address => uint256)) pendingDeposits;
    mapping (address => mapping(address => uint256)) pendingWithdrawals;

    /// @notice contract constructor make sender the manger and sets governance token to zero address
    constructor(address basketaddr, address kpo, address govtoken) public {
        manager = msg.sender;
        basketaddress = basketaddr;
        karteraPriceOracleAddress = kpo;
        karteraPriceOracle = IPriceOracle(kpo);
        governanceToken = govtoken;
    }

    /// @notice transfer manager
    function transferManager(address newmanager) external {
        require(msg.sender==manager, "Only manager can assign new manager" );
        manager = newmanager;
    }

    /// @notice set price oracle
    function setPriceOracle(address kpoaddress) external override {
        require(msg.sender==manager, "Sender not manager" );
        karteraPriceOracleAddress = kpoaddress;
        karteraPriceOracle = IPriceOracle(kpoaddress);
    } 

    /// @notice set governance token incentive multiplier
    function setGovernanceToken(address token_, uint256 multiplier) external override {
        require(msg.sender==manager, "Sender not manager" );
        governanceToken = token_;
        depositIncentiveMultiplier = multiplier;
        withdrawIncentiveMultiplier = multiplier;
        withdrawCostMultiplier = multiplier;
    }

    /// @notice modify incentive multiplier
    function setDepositIncentiveMultiplier(uint256 multiplier) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(governanceToken != address(0), 'Governance token not set');
        depositIncentiveMultiplier = multiplier;
    }

    /// @notice modify withdraw incentive multiplier
    function setWithdrawIncentiveMultiplier(uint256 multiplier) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(governanceToken != address(0), 'Governance token not set');
        withdrawIncentiveMultiplier = multiplier;
    }

    /// @notice set/modify active constituent withdraw cost multiplier
    function setWithdrawCostMultiplier(uint256 multiplier) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(governanceToken != address(0), 'Governance token not set');
        withdrawCostMultiplier = multiplier;
    }

    /// @notice price oracle address
    function setPriceOracleAddress(address priceoracleAddr) external override {
        require(msg.sender==manager, "Sender not manager" );
        karteraPriceOracleAddress = priceoracleAddr;
    }

    /// @notice add constituent to a basket
    function addConstituent(address conaddr, uint8 weight, uint8 weighttol) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress != conaddr , "Constituent already exists");
        require( totalWeight + weight <= 100, 'Total Weight Exceeds 100%');
        constituents[conaddr].constituentAddress = conaddr;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weighttol;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].acceptingDeposit = true;
        constituents[conaddr].id = numberOfConstituents;
        ERC20 token = ERC20(conaddr);
        constituents[conaddr].decimals = token.decimals();
        constituentAddress[numberOfConstituents] = conaddr;
        totalWeight += weight;
        numberOfConstituents++;
        numberOfActiveConstituents++;
    }

    // @notice activate constituent
    function activateConstituent(address conaddr) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress == conaddr && !constituents[conaddr].active, "Constituent does not exists or is already active");
        require(totalWeight + constituents[conaddr].weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight += constituents[conaddr].weight;
        constituents[conaddr].active = true;
        numberOfActiveConstituents++;
    }

    /// @notice remove constituent
    function removeConstituent(address conaddr) public override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress == conaddr && constituents[conaddr].active, "Constituent does not exist or is not active");
        totalWeight -= constituents[conaddr].weight;
        constituents[conaddr].active = false;
        numberOfActiveConstituents--;
    }

    /// @notice update constituent changes weight and weight tolerance after rebalancing to manager constituent weight close to desired
    function updateConstituent(address conaddr, uint8 weight, uint8 weightTolerance) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( totalWeight - constituents[conaddr].weight + weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight = totalWeight - constituents[conaddr].weight + weight;
        constituents[conaddr].weight = weight;
        constituents[conaddr].weightTolerance = weightTolerance;
    }

    function makeDepositCheck(address conaddr, uint256 numberoftokens) external view override returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( constituents[conaddr].active, "Constituent is not active");
        bool acceptingDeposits = constituents[conaddr].acceptingDeposit;
        require(acceptingDeposits, "No further deposits accepeted for this contract");

        uint256 amount  = pendingDeposits[msg.sender][conaddr];
        if(amount >= 0){
            return true;
        }

        return false;

        // (uint256 prc, uint8 decs) = constituentPrice(conaddr);
        // uint256 amount = SafeMath.mul(numberoftokens, prc);
        // amount= SafeMath.div(amount, power(10, decs));
        // uint256 minttokens = tokensForDeposit(amount);
        // uint256 incentivesOffered = depositIncentiveI(SafeMath.div(amount, basketDecimals), conaddr);
        // return (minttokens, incentivesOffered);
    }

    function AddDeposit(address conaddr, uint256 numberoftokens) external override {
        require(msg.sender==manager, "Sender is not manager" );
        constituents[conaddr].totalDeposit += numberoftokens;
    }

    function SubDeposit(address conaddr, uint256 numberoftokens) external override {
        require(msg.sender==manager, "Sender is not manager" );
        constituents[conaddr].totalDeposit -= numberoftokens;
    }

    /// @notice exchange basket tokens for removed constituent tokens
    function withdrawInactiveCheck(address conaddr, uint256 numberoftokens) external view override returns(bool) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(!constituents[conaddr].active, "Cannot withdraw from active constituent");

        return true;
        // uint256 tokenprice = tokenPriceI();
        // uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        // dollaramount = SafeMath.div(dollaramount, basketDecimals);
        // uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);

        // uint256 incentivesOffered = withdrawIncentiveI(SafeMath.div(dollaramount, basketDecimals), conaddr);
        // return (tokensredeemed, incentivesOffered);
    }

    /// @notice exchange basket tokens for active constituent tokens
    function withdrawActiveCheck(address conaddr, uint256 numberoftokens) external view override returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(constituents[conaddr].active, "Constituent is inactive");


        return true;

        // uint256 tokenprice = tokenPriceI();
        // uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        // uint256 withdrawcost = withdrawCostI(SafeMath.div(dollaramount, basketDecimals), conaddr);
        // withdrawcost = SafeMath.div(withdrawcost, basketDecimals);
        // // ERC20 tkn = ERC20(governanceToken);
        // // tkn.transferFrom(msg.sender, address(this), withdrawcost);

        // dollaramount = SafeMath.div(dollaramount, basketDecimals);
        // uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);
        // // ERC20 token = ERC20(conaddr);
        // // token.transfer(msg.sender, tokensredeemed);
        // // constituents[conaddr].totalDeposit -= tokensredeemed;

        // return (tokensredeemed, withdrawcost);
    }
    
    /// @notice update deposit threshold
    function updateDepositThreshold(uint256 depositthreshold) external override {
        require(msg.sender==manager, "Sender not manager" );
        depositThreshold = depositthreshold;
    }

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) public view override returns (address, uint8, uint8, bool, uint256, uint8) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        return (constituents[conaddr].constituentAddress,
                constituents[conaddr].weight,
                constituents[conaddr].weightTolerance,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit,
                constituents[conaddr].decimals);
    }

    /// @notice get all constituents including active and inactive
    function constituentStatus(address conaddr) public view override returns (bool) {
        return constituents[conaddr].active;
    }

    // /// @notice get all constituents including active and inactive
    // function numberOfAllConstituents() public view override returns (uint) {
    //     return numberOfConstituents;
    // }

    function constituentPrice(address conaddr) public view override returns (uint256, uint8) {
        require(karteraPriceOracleAddress!=address(0), 'Price Oracle not set');
        (uint256 prc, uint8 decimals) = karteraPriceOracle.price(conaddr);
        return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() public view override returns(uint256) {
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
            (uint prc, uint8 decs) = constituentPrice(addr);
            uint256 x = SafeMath.mul(prc, constituents[addr].totalDeposit);
            x = SafeMath.div(x, power(10, decs));            
            totaldeposit += x;
        }
        return totaldeposit;
    }

    /// @notice get price of one token of the basket
    function tokenPriceI() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        ERC20 basket = ERC20(basketaddress);
        if (totaldeposit > 0) {
            uint256 x = SafeMath.mul(totaldeposit, basketDecimals);
            x = SafeMath.div(x, basket.totalSupply());
            return x;
        }
        return SafeMath.mul(initialBasketValue, basketDecimals);
    }

    function tokenPrice() external view override returns (uint256) {
        return tokenPriceI();
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view override returns (uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(prc, basketDecimals);
        amount = SafeMath.div(amount, power(10, decs));
        uint256 tokens = tokensForDeposit(amount);
        return tokens;
    }

    /// @notice # of basket tokens for deposit $ amount 
    function tokensForDeposit(uint amount) public view returns (uint256) {
        uint256 x = SafeMath.mul(amount, basketDecimals);
        x = SafeMath.div(x, tokenPriceI());
        return x;
    }

    /// @notice number of inactive constituent tokens for 1 basket token
    function depositsForTokens(address conaddr, uint numberoftokens) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 x = SafeMath.mul(numberoftokens, tokenPriceI());
        x = SafeMath.mul(x, power(10, decs));
        x = SafeMath.div(x, prc);
        return x;
    }

    /// @notice number of inactive constituent tokens for dollar amount 
    function depositsForDollar(address conaddr, uint256 dollaramount) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 x = SafeMath.mul(dollaramount, power(10, decs));
        x = SafeMath.div(x, prc);
        return x;
    }

    /// @notice if deposits can be made for a constituents
    function acceptingDepositI(address conaddr) public view returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        uint currentweight = 0;
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > depositThreshold){
            (uint256 prc, uint8 decs) = constituentPrice(conaddr);
            currentweight = SafeMath.mul(100, constituents[conaddr].totalDeposit);
            currentweight = SafeMath.mul(currentweight, prc);
            currentweight = SafeMath.div(currentweight, totaldeposit);
            currentweight = SafeMath.div(currentweight, power(10, decs));
        }else{
            return true;
        }
        if (currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    function acceptingDeposit(address conaddr) external view override returns (bool) {
        return acceptingDepositI(conaddr);
    }

    function acceptingActualDepositI(address conaddr, uint256 numberOfTokens) public view virtual returns (bool) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        uint256 currentweight = 0;
        uint256 totaldeposit = totalDepositAfter(conaddr, numberOfTokens);
        if (totaldeposit > depositThreshold){
            (uint256 prc, uint8 decs) = constituentPrice(conaddr);
            currentweight = SafeMath.mul(100, SafeMath.add(constituents[conaddr].totalDeposit, numberOfTokens));
            currentweight = SafeMath.mul(currentweight, prc);
            currentweight = SafeMath.div(currentweight, totaldeposit);
            currentweight = SafeMath.div(currentweight, power(10, decs));
        }else{
            return true;
        }
        if (uint8(currentweight) < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) external view override returns (bool) {
        return acceptingActualDepositI(conaddr, numberOfTokens);
    }

    /// @notice total # of tokens after new deposit
    function totalDepositAfter(address conaddr, uint256 numberOfTokens) internal view virtual returns(uint256) {
        
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
            (uint prc, uint8 decs) = constituentPrice(addr);
            if(addr==conaddr){
                uint256 x = SafeMath.mul(prc, SafeMath.add(constituents[addr].totalDeposit, numberOfTokens));
                x = SafeMath.div(x, power(10, decs));
                totaldeposit += x;
            }else{
                uint256 x = SafeMath.mul(prc, constituents[addr].totalDeposit);
                x = SafeMath.div(x, power(10, decs));
                totaldeposit += x;
            }
        }
        return totaldeposit;
    }

    /// @notice get number of incentive tokens for $ deposit
    function depositIncentiveI(uint256 dollaramount, address conaddr) public view returns (uint256) {
        if(governanceToken == address(0)){
            return 0;
        }
        ERC20 token = ERC20(governanceToken);
        uint256 karterasupply = token.balanceOf(basketaddress);
        uint256 d = SafeMath.mul(depositIncentiveMultiplier, dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    function depositIncentive(uint256 dollaramount, address conaddr) external view override returns (uint256) {
        return depositIncentiveI(dollaramount, conaddr);
    }


    /// @notice get number of incentive tokens for $ withdrawn
    function withdrawIncentiveI(uint256 dollaramount, address conaddr) public view returns (uint256) {
        if(governanceToken == address(0)){
            return 0;
        }
        ERC20 token = ERC20(governanceToken);
        uint256 karterasupply = token.balanceOf(basketaddress);
        uint256 d = SafeMath.mul(withdrawIncentiveMultiplier, dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    function withdrawIncentive(uint256 dollaramount, address conaddr) public view override returns (uint256) {
        return withdrawIncentiveI(dollaramount, conaddr);
    }


    /// @notice get number of tokens to depost inorder to withdraw from active constituent
    function withdrawCostI(uint256 longdollaramount, address conaddr) public view returns (uint256) {
        require(governanceToken != address(0), 'cannot withdraw');
        uint256 d = SafeMath.mul(withdrawCostMultiplier, longdollaramount);
        return d;
    }

    function withdrawCost(uint256 longdollaramount, address conaddr) public view override returns (uint256) {
        return withdrawCostI(longdollaramount, conaddr);
    }

    function copyState(address oldcontainer) public {
        require(msg.sender==manager, "Sender not manager" );
        IBasketLib basketInterface = IBasketLib(oldcontainer);
        uint16 n = basketInterface.numberOfConstituents();
        for(uint16 i=0; i<n; i++){
            address conaddr = basketInterface.constituentAddress(i);
            constituentAddress[i] = conaddr;
            (address conaddr_, uint8 weight, uint8 weighttol, bool active, uint256 td, uint8 decimals) = basketInterface.getConstituentDetails(conaddr);
            constituents[conaddr].constituentAddress = conaddr_;
            constituents[conaddr].weight = weight;
            constituents[conaddr].weightTolerance = weighttol;
            constituents[conaddr].id = i;
            constituents[conaddr].active = active;
            constituents[conaddr].totalDeposit = td;
            constituents[conaddr].decimals = decimals;
        }

    }


    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
    
    
}