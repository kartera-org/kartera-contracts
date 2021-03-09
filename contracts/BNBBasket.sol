// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IBasketLibV3.sol";

contract BNBBasket is ERC20("Kartera BNB Basket", "kBNB"), Ownable {

    // address of manager of the basket 
    address public manager;

    // basket contract address
    address public basketLibAddress;

    IBasketLibV3 basketLib;

    /// @notice address of governance token offered as incentive kart token address
    address public governanceToken;

    /// @notice pause deposit withdraw if library interface is changing
    bool public pause_ = true;

    /// @notice contract constructor make sender the manger and sets governance token to zero address
    constructor() public {
        manager = msg.sender;
        governanceToken = address(0);
    }

    modifier onlyManagerOrOwner() {
        require(msg.sender == manager || msg.sender == owner());
        _;
    }

    /// @notice transfer manager
    function transferManager(address newmanager) external onlyManagerOrOwner {
        manager = newmanager;
    }

    function setBasketLib(address basketLibAddr) external onlyManagerOrOwner {
        require(pause_, 'Contract is not paused');
        basketLibAddress = basketLibAddr;
        basketLib = IBasketLibV3(basketLibAddr);
    }

    function pause() external onlyManagerOrOwner {
        pause_ = true;
    }

    function unpause() external onlyManagerOrOwner {
        pause_ = false;
    }

    /// @notice set governance token incentive multiplier
    function setGovernanceToken(address token_, uint256 multiplier) external onlyManagerOrOwner {
        governanceToken = token_;
        basketLib.setGovernanceToken(token_, multiplier);
    }

    function setPriceOracle(address kpoaddress) external onlyManagerOrOwner {
        basketLib.setPriceOracle(kpoaddress);
    }

    /// @notice mint additional tokens by basket
    function mint(address _to, uint256 _amount) external onlyOwner{
        _mint(_to, _amount);
    }

    /// @notice modify incentive multiplier
    function setDepositIncentiveMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        basketLib.setDepositIncentiveMultiplier(multiplier);
    }

    /// @notice modify withdraw incentive multiplier
    function setWithdrawIncentiveMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        basketLib.setWithdrawIncentiveMultiplier(multiplier);
    }

    /// @notice set/modify active constituent withdraw cost multiplier
    function setWithdrawCostMultiplier(uint256 multiplier) external onlyManagerOrOwner {
        basketLib.setWithdrawCostMultiplier(multiplier);
    }

    /// @notice add constituent to a basket
    function addConstituent(address conaddr, uint8 weight, uint8 weighttol) external onlyManagerOrOwner {
        basketLib.addConstituent(conaddr, weight, weighttol);
    }

    // @notice activate constituent
    function activateConstituent(address conaddr) external onlyManagerOrOwner {
        basketLib.activateConstituent(conaddr);
    }

    /// @notice remove constituent
    function removeConstituent(address conaddr) external onlyManagerOrOwner {
        basketLib.removeConstituent(conaddr);
    }

    /// @notice update constituent changes weight and weight tolerance after rebalancing to manager constituent weight close to desired
    function updateConstituent(address conaddr, uint8 weight, uint8 weightTolerance) external onlyManagerOrOwner {
        basketLib.updateConstituent(conaddr, weight, weightTolerance);
    }

    /// @notice transfer tokens
    function transferTokens(address conaddr, address to, uint256 amount) external onlyOwner {
        ERC20 token = ERC20(conaddr);
        uint256 balance = token.balanceOf(address(this));
        if(balance>= amount){
            token.transfer(to, amount);
        }
    }

    /// @notice external call to depoit tokens to basket and receive equivalent basket tokens
    function makeDeposit(address conaddr, uint256 numberoftokens) external payable returns (bool) {
        require(!pause_, 'Contract is paused');


        bool success = basketLib.makeDepositCheck(conaddr, numberoftokens);

        return success;

        // require(numberoftokens<=msg.value, 'Incorrect deposit amount');

        // _mint(msg.sender, minttokens);

        // basketLib.AddDeposit(conaddr, numberoftokens);
        
        // if(incentiveOffered>0){
        //     ERC20 tkn = ERC20(governanceToken);
        //     tkn.transfer(msg.sender, incentiveOffered);
        // }
    }

    /// @notice exchange basket tokens for removed constituent tokens
    function withdrawInactive(address conaddr, uint256 numberoftokens) external payable returns (bool) {
        require(!pause_, 'Contract is paused');

        bool success = basketLib.withdrawInactiveCheck(conaddr, numberoftokens);

        return success;
        // msg.sender.transfer(tokensredeemed);

        // _burn(msg.sender, numberoftokens);
        // basketLib.SubDeposit(conaddr, tokensredeemed);

        // if(incentiveOffered>0){
        //     ERC20 tkn = ERC20(governanceToken);
        //     tkn.transfer(msg.sender, incentiveOffered);
        // }
    }

    /// @notice exchange basket tokens for active constituent tokens
    function withdrawActive(address conaddr, uint256 numberoftokens) external payable returns (bool) {
        require(!pause_, 'Contract is paused');

        bool success = basketLib.withdrawActiveCheck(conaddr, numberoftokens);

        return success;

        // msg.sender.transfer(tokensredeemed);
        
        // basketLib.SubDeposit(conaddr, tokensredeemed);
        // ERC20 tkn = ERC20(governanceToken);
        // if(withdrawcost>0){
        //     tkn.transferFrom(msg.sender, address(this), withdrawcost);
        // }
        // _burn(msg.sender, numberoftokens);
    }

    function processDepositsAndWithDrawals() external returns (bool) {
        
    }

    /// @notice get deposit threshold
    function depositThreshold() external view returns (uint256) {
        return basketLib.depositThreshold();
    }
    
    /// @notice update deposit threshold
    function updateDepositThreshold(uint256 depositthreshold) external onlyManagerOrOwner {
        basketLib.updateDepositThreshold(depositthreshold);
    }

    /// @notice get constituent from index
    function constituentAddress(uint16 indx) external view returns (address) {
        return basketLib.constituentAddress(indx);
    }

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) external view returns (address, uint8, uint8, bool, uint256, uint8) {
        return basketLib.getConstituentDetails(conaddr);
    }

    function constituentPrice(address conaddr) external view returns (uint256, uint8) {
        (uint256 prc, uint8 decimals) = basketLib.constituentPrice(conaddr);
        return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() external view returns(uint256) {
        return basketLib.totalDeposit();
    }

    /// @notice get price of one token of the basket
    function tokenPrice() external view returns (uint256) {
        return basketLib.tokenPrice();
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256) {
        return basketLib.exchangeRate(conaddr);
    }

    /// @notice if deposits can be made for a constituents
    function acceptingDeposit(address conaddr) external view returns (bool) {
        return basketLib.acceptingDeposit(conaddr);
    }

    /// @notice if amount deposited is acceptabledeposits can be made for a constituents
    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) external view returns (bool) {
        return basketLib.acceptingActualDeposit(conaddr, numberOfTokens);
    }

    /// @notice get number of incentive tokens for $ deposit
    function depositIncentive(uint256 dollaramount, address conaddr) external view returns (uint256) {
        return basketLib.depositIncentive(dollaramount, conaddr);
    }

    /// @notice get number of incentive tokens for $ withdrawn
    function withdrawIncentive(uint256 dollaramount, address conaddr) external view returns (uint256) {
        return basketLib.withdrawIncentive(dollaramount, conaddr);
    }

    /// @notice get number of tokens to depost inorder to withdraw from active constituent
    function withdrawCost(uint256 longdollaramount, address conaddr) external view returns (uint256) {
        return basketLib.withdrawCost(longdollaramount, conaddr);
    }

    function depositIncentiveMultiplier() external view returns (uint256) {
        uint256 x = basketLib.depositIncentiveMultiplier();
        return x;
    }
    
    // get withdrawIncentiveMultiplier
    function withdrawIncentiveMultiplier() external view returns (uint256) {
        return basketLib.withdrawIncentiveMultiplier();
    }

    // get withdrawCostMultiplier
    function withdrawCostMultiplier() external view returns (uint256) {
        return basketLib.withdrawCostMultiplier();
    }

    /// @notice get number of constituents
    function numberOfConstituents() external view returns (uint16) {
        return basketLib.numberOfConstituents();
    }

    /// @notice get number of active constituents
    function numberOfActiveConstituents() external view returns (uint16) {
        return basketLib.numberOfActiveConstituents();
    }
}