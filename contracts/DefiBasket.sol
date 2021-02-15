// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IBasketLib.sol";

/// @title DefiBasket 
contract DefiBasket is ERC20("Kartera Defi Basket", "kDEFI"), Ownable, ERC20Burnable {

    // address of manager of the basket 
    address public manager;

    // price at which first token is issued
    uint256 public initialBasketValue = 100;

    // total number of constituents in the basket 
    uint16 public numberOfConstituents = 0;

    // total number of active constituents in the basket 
    uint16 public numberOfActiveConstituents = 0;

    // map of constituents by address
    mapping (address => Constituent) public constituents;

    // map of constituent address by index
    mapping (uint16 => address) public constituentAddress;

    // basket contract address
    address basketContractAddress;

    // total weight 
    uint8 public totalWeight = 0;

    // parameter overrides weight of each constituent until $1m
    uint256 public depositThreshold =  1000000000000000000000000;

    // address of governance token offered as incentive kart token address
    address public governanceToken;

    // # of kartera tokens offered for $1 deposit
    uint256 public depositIncentiveMultiplier;

    // # of kartera tokens offered for $1 withdraw
    uint256 public withdrawIncentiveMultiplier;
    
    uint256 public withdrawCostMultiplier;

    IBasketLib basketLib;

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
        uint16 id;
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

    function setBasketLib(address basketlibaddr) external onlyManagerOrOwner {
        basketLib = IBasketLib(basketlibaddr);
    }

    /// @notice set governance token incentive multiplier
    function setGovernanceToken(address token_, uint256 multiplier) external onlyManagerOrOwner {
        governanceToken = token_;
        depositIncentiveMultiplier = multiplier;
        withdrawIncentiveMultiplier = multiplier;
        withdrawCostMultiplier = multiplier;
    }

    /// @notice mint additional tokens by basket
    function mint(address _to, uint256 _amount) external onlyOwner{
        _mint(_to, _amount);
    }

    /// @notice modify incentive multiplier
    function setDepositIncentiveMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        require(governanceToken != address(0), 'Governance token not set');
        depositIncentiveMultiplier = multiplier;
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
        numberOfActiveConstituents++;
    }

    // @notice activate constituent
    function activateConstituent(address conaddr) external onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress == conaddr && !constituents[conaddr].active, "Constituent does not exists or is already active");
        require(totalWeight + constituents[conaddr].weight <= 100, 'Total Weight Exceeds 100%');
        totalWeight += constituents[conaddr].weight;
        constituents[conaddr].active = true;
        numberOfActiveConstituents++;
    }

    /// @notice remove constituent
    function removeConstituent(address conaddr) public onlyManagerOrOwner {
        require(constituents[conaddr].constituentAddress == conaddr && constituents[conaddr].active, "Constituent does not exist or is not active");
        totalWeight -= constituents[conaddr].weight;
        constituents[conaddr].active = false;
        numberOfActiveConstituents--;
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
        bool acceptingDeposits = acceptingActualDeposit(conaddr, numberoftokens);
        require(acceptingDeposits, "No further deposits accepeted for this contract");
        (uint256 prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(numberoftokens, prc);
        amount = SafeMath.div(amount, power(10, decs));
        uint256 minttokens = tokensForDeposit(amount);
        ERC20 token = ERC20(conaddr);
        token.transferFrom(msg.sender, address(this), numberoftokens);
        _mint(msg.sender, minttokens);
        constituents[conaddr].totalDeposit += numberoftokens;

        uint256 incentivesOffered = depositIncentive(SafeMath.div(amount, power(10, decimals())));
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
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        dollaramount = SafeMath.div(dollaramount, power(10, decimals()));
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
    function withdrawActive(address conaddr, uint256 numberoftokens) external payable {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require(constituents[conaddr].active, "Constituent is inactive");
        uint256 tokenprice = tokenPrice();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        uint256 withdrawcost = withdrawCost(SafeMath.div(dollaramount, power(10, decimals())));
        withdrawcost = SafeMath.div(withdrawcost, power(10, decimals()));
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

    /// @notice get constituent from index
    function getConstituentAddress(uint8 indx) external view returns (address) {
        return constituentAddress[indx];
    }

    function getConstituentAddress(address conaddr) external view returns (address) {
        return constituents[conaddr].constituentAddress;
    }

    function getConstituentDeposit(address conaddr) external view returns (uint256) {
        return constituents[conaddr].totalDeposit;
    }

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) external view returns (address, uint8, uint8, bool, uint256, uint8) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        return (constituents[conaddr].constituentAddress,
                constituents[conaddr].weight,
                constituents[conaddr].weightTolerance,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit,
                constituents[conaddr].decimals);
    }

    /// @notice get all constituents including active and inactive
    function getConstituentStatus(address conaddr) external view returns (bool) {
        return constituents[conaddr].active;
    }

    /// @notice get constituent weight
    function getConstituentWeight(address conaddr) external view returns (uint8) {
        return constituents[conaddr].weight;
    }

    /// @notice get constituent weight tol
    function getConstituentWeightTol(address conaddr) external view returns (uint8) {
        return constituents[conaddr].weightTolerance;
    }

    function constituentPrice(address conaddr) public view returns (uint256, uint8) {
        (uint256 prc, uint8 decimals) = basketLib.getPrice(conaddr);
        return (prc, decimals);
        
        // Basket basket = Basket(basketContractAddress);
        // (uint256 prc, uint8 decimals) = basket.getPrice(conaddr);
        // return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() public view returns(uint256) {
        return basketLib.totalDeposit();
        // uint256 totaldeposit = 0;
        // for(uint8 i = 0; i < numberOfConstituents; i++) {
        //     address addr = constituentAddress[i];
        //     (uint prc, uint8 decs) = constituentPrice(addr);
        //     uint256 x = SafeMath.mul(prc, constituents[addr].totalDeposit);
        //     x = SafeMath.div(x, power(10, decs));
        //     totaldeposit += x;
        // }
        // return totaldeposit;
    }

    /// @notice get price of one token of the basket
    function tokenPrice() public view returns (uint256) {
        return basketLib.basketPrice();
        // uint256 totaldeposit = totalDeposit();
        // if (totaldeposit > 0) {
        //     uint256 x  =SafeMath.mul(totaldeposit, power(10, decimals()));
        //     x = SafeMath.div(x, totalSupply());
        //     return x;
        // }
        // return SafeMath.mul(initialBasketValue, power(10, decimals()));
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256) {
        return basketLib.exchangeRate(conaddr);
        // require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        // (uint prc, uint8 decs) = constituentPrice(conaddr);
        // uint256 amount = SafeMath.mul(prc, power(10, decimals()));
        // amount = SafeMath.div(amount, power(10, decs));
        // uint256 tokens = tokensForDeposit(amount);
        // return tokens;
    }

    /// @notice # of basket tokens for deposit $ amount 
    function tokensForDeposit(uint amount) public view returns (uint256) {
        return basketLib.tokensForDeposit(amount);
        // uint256 x = SafeMath.mul(amount, power(10, decimals()));
        // x = SafeMath.div(x, tokenPrice());
        // return x;
    }

    /// @notice number of inactive constituent tokens for 1 basket token
    function depositsForTokens(address conaddr, uint numberoftokens) public view returns (uint256) {
        return basketLib.depositsForTokens(conaddr, numberoftokens);
        // (uint prc, uint8 decs) = constituentPrice(conaddr);
        // uint256 x = SafeMath.mul(numberoftokens, tokenPrice());
        // x = SafeMath.mul(x, power(10, decs));
        // x = SafeMath.div(x, prc);
        // return x;
    }

    /// @notice number of inactive constituent tokens for dollar amount 
    function depositsForDollar(address conaddr, uint256 dollaramount) public view returns (uint256) {
        return basketLib.depositsForDollar(conaddr, dollaramount);
        // (uint prc, uint8 decs) = constituentPrice(conaddr);
        // uint256 x = SafeMath.mul(dollaramount, power(10, decs));
        // x = SafeMath.div(x, prc);
        // return x;
    }
        
    /// @notice number of incentive tokens required to withdraw constituent
    function constituentWithdrawCost(uint256 numberoftokens) public view returns (uint256){
        return basketLib.constituentWithdrawCost(numberoftokens);
        // uint256 tokenprice = tokenPrice();
        // uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        // uint256 withdrawcost = withdrawCost(SafeMath.div(dollaramount, power(10, decimals())));
        // withdrawcost = SafeMath.div(withdrawcost, power(10, decimals()));
        // return withdrawcost;
    }

    /// @notice if deposits can be made for a constituents
    function acceptingDeposit(address conaddr) public view returns (bool) {
        return basketLib.acceptingDeposit(conaddr);
    }

    /// @notice if amount deposited is acceptabledeposits can be made for a constituents
    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) public view returns (bool) {
        return basketLib.acceptingActualDeposit(conaddr, numberOfTokens);
    }

    /// @notice get number of incentive tokens for $ deposit
    function depositIncentive(uint256 dollaramount) public view returns (uint256) {
        return basketLib.depositIncentive(dollaramount);
        // if(governanceToken == address(0)){
        //     return 0;
        // }
        // Basket basket = Basket(basketContractAddress);
        // uint256 d = basket.depositIncentive(governanceToken, depositIncentiveMultiplier, dollaramount);
        // return d;
    }

    /// @notice get number of incentive tokens for $ withdrawn
    function withdrawIncentive(uint256 dollaramount) public view returns (uint256) {
        return basketLib.withdrawIncentive(dollaramount);
    }

    /// @notice get number of tokens to depost inorder to withdraw from active constituent
    function withdrawCost(uint256 longdollaramount) public view returns (uint256) {
        return basketLib.withdrawCost(longdollaramount);
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}