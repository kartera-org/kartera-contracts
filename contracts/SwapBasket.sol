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

    address public manager;

    // swap Library contract address
    address public swapLibAddress;

    // library to handle functionalities
    ISwapLib swapLib;

    // kartFarm receives part of swap fee as basket tokens to be distributed among kart holders
    address kartFarm;

    // internal (dummy) address for ether to add to constituents map
    address ethAddress = address(0x0000000000000000000000000000000000000001);

    /// @notice pause deposit withdraw if library interface is changing
    bool public pause_ = true;

    /// @notice contract constructor makes sender the manger
    constructor() public {
        manager = msg.sender;
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

    function setPriceOracle(address kpoaddress) external onlyManagerOrOwner {
        swapLib.setPriceOracle(kpoaddress);
    }

    function setKartFarmAddress(address kartfarm) external onlyManagerOrOwner {
        kartFarm = kartfarm;
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
        uint256 minttokens = swapLib.addLiquidity(msg.sender, conaddr, numberoftokens);
        _mint(msg.sender, minttokens);
    }

    /// @notice external call to withdraw liquidity from the basket and receive any equivalent tokens requested
    function withdrawLiquidity(address conaddr, uint256 numberoftokens) external payable {
        require(!pause_, 'Contract is paused');

        uint256 tokensredeemed = swapLib.withdrawLiquidity(msg.sender, conaddr, numberoftokens);
        if(conaddr!=ethAddress){
            IERC20 token = IERC20(conaddr);
            token.transfer(msg.sender, tokensredeemed);
        }else{
            msg.sender.transfer(tokensredeemed);
        }
        _burn(msg.sender, numberoftokens);
    }

    /// @notice external call to emergency withdraw liquidity from the basket and receive any equivalent tokens requested this call incurs swap fee
    function emergencyWithdrawLiquidity(address conaddr, uint256 numberoftokens) external payable {
        require(!pause_, 'Contract is paused');

        (uint256 tokensredeemed, uint256 govShare) = swapLib.emergencyWithdrawLiquidity(msg.sender, conaddr, numberoftokens);
        if(conaddr!=ethAddress){
            ERC20 token = ERC20(conaddr);
            token.transfer(msg.sender, tokensredeemed);
        }else{
            msg.sender.transfer(tokensredeemed);
        }
        _burn(msg.sender, numberoftokens);
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

    /// @notice get number of active constituents
    function swap(address tokenA, address tokenB, uint256 amount) external payable {
        IERC20 tokena = IERC20(tokenA);
        tokena.transferFrom(msg.sender, address(this), amount);
        (uint256 tokensReceived, uint256 govShare) = swapLib.swap(tokenA, tokenB, amount);
        // _mint(kartFarm, govShare);
        IERC20 tokenb = IERC20(tokenB);
        tokenb.transfer(msg.sender, tokensReceived);
    }

}