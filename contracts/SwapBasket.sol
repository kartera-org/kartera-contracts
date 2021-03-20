// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ISwapLib.sol";

/// @title SwapBasket 
contract SwapBasket is ERC20("Kartera Swap Basket", "kETH"), Ownable {

    event AddLiquidity(address indexed lpuser, address indexed swpaddr, uint256 amount);
    event WithdrawLiquidity(address indexed lpuser, address indexed swpaddr, uint256 amount);
    event Swap( address indexed lpuser, address indexed swpaddrFrom, address indexed swpaddrTo, uint256 amount );

    address public manager;

    // kartera Token
    IERC20 karteraToken;

    // swap Library contract address
    address swapLibAddress;

    // library to handle functionalities
    ISwapLib swapLib;

    // kartFarm receives part of swap fee as basket tokens to be distributed among kart holders
    address kartFarm;

    // swapFarm 
    address swapFarm;

    // internal (dummy) address for ether to add to constituents map
    address ethAddress = address(0x0000000000000000000000000000000000000001);

    /// @notice pause deposit, withdraw if library interface is changing
    bool public pause_ = true;

    /// @notice pause swap/trading
    bool public tradingAllowed_ = false;

    /// @notice contract constructor makes sender the manger
    constructor(address karteratoken) public {
        manager = msg.sender;
        karteraToken = IERC20(karteratoken);
    }

    modifier onlyManagerOrOwner() {
        require(msg.sender == manager || msg.sender == owner());
        _;
    }

    /// @notice transfer manager
    function transferManager(address newmanager) external onlyManagerOrOwner {
        manager = newmanager;
    }

    function setSwapLib(address swapLibAddr) external onlyManagerOrOwner {
        require(pause_, 'Contract is not paused');
        swapLibAddress = swapLibAddr;
        swapLib = ISwapLib(swapLibAddr);
    }

    function pause() external onlyManagerOrOwner {
        pause_ = true;
    }

    function unpause() external onlyManagerOrOwner {
        pause_ = false;
    }

    function pauseTrading() external onlyManagerOrOwner {
        tradingAllowed_ = false;
    }

    function unpauseTrading() external onlyManagerOrOwner {
        tradingAllowed_ = true;
    }

    function setPriceOracle(address kpoaddress) external onlyManagerOrOwner {
        swapLib.setPriceOracle(kpoaddress);
    }

    function setKartFarmAddress(address kartfarm) external onlyManagerOrOwner {
        kartFarm = kartfarm;
    }

    function setSwapFarmAddress(address swapfarm) external onlyManagerOrOwner {
        swapFarm = swapfarm;
    }

    function setSwapFees(uint8 _fee, uint8 _govfee) external onlyManagerOrOwner{
        require(pause_, 'Contract is not paused');
        swapLib.setSwapFees(_fee, _govfee);
    }

    /// @notice add constituent to a swap basket
    function addConstituent(address conaddr) external onlyManagerOrOwner {
        swapLib.addConstituent(conaddr);
    }

    /// @notice remove constituent stop accepting liquidity
    function removeConstituent(address conaddr) external onlyManagerOrOwner {
        swapLib.removeConstituent(conaddr);
    }

    /// @notice transfer tokens
    function transferTokens(address conaddr, address to, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(conaddr);
        uint256 balance = token.balanceOf(address(this));
        if(balance>= amount){
            token.transfer(to, amount);
        }
    }

    /// @notice external call to depoit liquidity to the basket and receive equivalent basket (LP) tokens
    function addLiquidity(address conaddr, uint256 numberoftokens) external payable {
        require(!pause_, 'Contract is paused');

        if(conaddr!=ethAddress){
            IERC20 token = IERC20(conaddr);
            token.transferFrom(msg.sender, address(this), numberoftokens);
        }else{
            require(numberoftokens<=msg.value, 'Incorrect deposit amount');
        }
        uint256 minttokens = swapLib.addLiquidity(conaddr, numberoftokens);
        _mint(msg.sender, minttokens);
        
        emit AddLiquidity(msg.sender, conaddr, numberoftokens);
    }

    /// @notice external call to withdraw liquidity from the basket and receive any equivalent tokens requested
    function withdrawLiquidity(address conaddr, uint256 numberoftokens) external payable {
        require(!pause_, 'Contract is paused');

        (uint256 tokensredeemed, uint256 cost) = swapLib.withdrawLiquidity(conaddr, numberoftokens);
        _burn(msg.sender, numberoftokens);
        if(conaddr!=ethAddress){
            IERC20 token = IERC20(conaddr);
            token.transfer(msg.sender, tokensredeemed);
        }else{
            msg.sender.transfer(tokensredeemed);
        }
        karteraToken.transferFrom(msg.sender, swapFarm, cost);

        emit WithdrawLiquidity(msg.sender, conaddr, numberoftokens);
    }

    /// @notice get constituent from index
    function constituentAddress(uint16 indx) external view returns (address) {
        return swapLib.constituentAddress(indx);
    }

    function constituentInfo(address conaddr) external view returns (address, bool, uint256, uint8) {
        return swapLib.constituentInfo(conaddr);
    }

    function constituentPrice(address conaddr) external view returns (uint256, uint8) {
        (uint256 prc, uint8 decimals) = swapLib.constituentPrice(conaddr);
        return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() external view returns(uint256) {
        return swapLib.totalDeposit();
    }

    /// @notice get price of one token of the basket
    function basketTokenPrice() external view returns (uint256) {
        return swapLib.basketTokenPrice();
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256) {
        return swapLib.exchangeRate(conaddr);
    }

    /// @notice get number of constituents
    function numberOfConstituents() external view returns (uint16) {
        return swapLib.numberOfConstituents();
    }

    /// @notice get number of active constituents
    function numberOfActiveConstituents() external view returns (uint16) {
        return swapLib.numberOfActiveConstituents();
    }

    /// @notice get withdrawCostMultiplier
    function withdrawCostMultiplier() external view returns (uint256) {
        return swapLib.withdrawCostMultiplier();
    }

    /// @notice set withdrawCostMultiplier
    function setWithdrawCostMultiplier(uint256 withdrawcostmultiplier) external {
        swapLib.setWithdrawCostMultiplier(withdrawcostmultiplier);
    }

    /// @notice get withdrawCost
    function withdrawCost(uint256 numberOfBasketTokens) external view returns (uint256) {
        return swapLib.withdrawCost(numberOfBasketTokens);
    }

    /// @notice get number of active constituents
    function swap(address tokenA, address tokenB, uint256 amount) external payable {
        require(!pause_ && tradingAllowed_, 'Swapping is paused');
        require(tokenA != tokenB, 'Tokens are same');

        if(tokenA!=ethAddress){
            IERC20 tokena = IERC20(tokenA);
            tokena.transferFrom(msg.sender, address(this), amount);
        }else{
            require(amount<=msg.value, 'Incorrect deposit amount');
        }
        (uint256 tokensReceived, uint256 govShare) = swapLib.swap(tokenA, tokenB, amount);
        _mint(kartFarm, govShare);
        if(tokenB!=ethAddress){
            IERC20 tokenb = IERC20(tokenB);
            tokenb.transfer(msg.sender, tokensReceived);
        }else{
            msg.sender.transfer(tokensReceived);
        }
        emit Swap( msg.sender, tokenA, tokenB, amount );
    }

    /// @notice get swap rate for 1 tokenA to tokenB
    function swapRate(address tokenA, address tokenB) external view returns (uint256){
        return swapLib.swapRate(tokenA, tokenB);
    }

}