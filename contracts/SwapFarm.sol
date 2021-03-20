// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISwapFarmLib.sol";
import "./KarteraToken.sol";

contract SwapFarm is Ownable {

    event Deposit(address indexed lpuser, address indexed swpBasketAddr, uint256 deposits);
    event Withdraw(address indexed lpuser, address indexed swpBasketAddr, uint256 deposits);
    event WithdrawAll( address indexed lpuser, address indexed swpBasketAddr, uint256 deposits );
    event CollectRewards(address indexed user, address indexed swpBasketAddr);

    ISwapFarmLib swapFarmLib;

    // kartera token address
    KarteraToken public kart;

    constructor(address rewardTokenAddr) public {
        kart = KarteraToken(rewardTokenAddr);
    }

    function setSwapFarmLib(address swapFarmLibAddr) onlyOwner external {
        swapFarmLib = ISwapFarmLib(swapFarmLibAddr);
    }

    function resetBasket(address swpBasketAddr) public {
        (uint256 tobasket) = swapFarmLib.resetBasket(swpBasketAddr);
        kart.mint(address(this), tobasket);
    }

    function resetAllBaskets() public {
        uint256 numberofbaskets = swapFarmLib.numberOfBaskets();
        for(uint256 i=0; i<numberofbaskets; i++) {
            resetBasket(swapFarmLib.basketAddress(i));
        }
    }

    function addBasket(address swpBasketAddr, uint256 allocation_) external onlyOwner {
        resetAllBaskets();
        swapFarmLib.addBasket(swpBasketAddr, allocation_);
    }
    
    function modifyBasket(address swpBasketAddr, uint256 allocation_) external onlyOwner {
        resetAllBaskets();
        swapFarmLib.modifyBasket(swpBasketAddr, allocation_);
    }

    function deposit(address swpBasketAddr, uint256 numberoftokens) external {
        resetBasket(swpBasketAddr);
        uint256 tokens = swapFarmLib.deposit(msg.sender, swpBasketAddr, numberoftokens);
        IERC20 tkn = IERC20(swpBasketAddr);
        tkn.transferFrom(msg.sender, address(this), numberoftokens);
        if(tokens>0) {
            safeTransfer(msg.sender, tokens);
        }
        emit Deposit(msg.sender, swpBasketAddr, numberoftokens);
    }

    function withdraw(address swpBasketAddr, uint256 numberoftokens) external {
        resetBasket(swpBasketAddr);
        uint256 karttokens = swapFarmLib.withdraw(msg.sender, swpBasketAddr, numberoftokens);
        IERC20 swapTkn = IERC20(swpBasketAddr);
        swapTkn.transfer(msg.sender, numberoftokens);
        safeTransfer(msg.sender, karttokens);
        emit Withdraw(msg.sender, swpBasketAddr, numberoftokens);
    }

    function withdrawAll(address swpBasketAddr) external {
        resetBasket(swpBasketAddr);
        (uint256 deposits, uint256 tokens)= swapFarmLib.withdrawAll(msg.sender, swpBasketAddr);
        IERC20 swapTkn = IERC20(swpBasketAddr);
        swapTkn.transfer(msg.sender, deposits);
        safeTransfer(msg.sender, tokens);
        emit WithdrawAll(msg.sender, swpBasketAddr, deposits);
    }

    function collectRewards(address swpBasketAddr) external {
        resetBasket(swpBasketAddr);
        uint256 tokens = swapFarmLib.collectRewards(msg.sender, swpBasketAddr);
        IERC20 swapTkn = IERC20(swpBasketAddr);
        safeTransfer(msg.sender, tokens);
    }

    function accumulatedRewards(address lpAddr, address swpBasketAddr) external view returns (uint256 rewards){
        rewards = swapFarmLib.accumulatedRewards(lpAddr, swpBasketAddr);
    }

    function lockedTokens(address lpuser, address swpBasketAddr) external view returns (uint256) {
        return swapFarmLib.lockedTokens(lpuser, swpBasketAddr);
    }

    function safeTransfer(address to, uint256 numberoftokens) internal {
        uint256 bal = kart.balanceOf(address(this));
        if (numberoftokens > bal) {
            kart.transfer(to, bal);
        } else {
            kart.transfer(to, numberoftokens);
        }
    }

    function numberOfBaskets() external view returns (uint256) {
        return swapFarmLib.numberOfBaskets();
    }

    function basketAddress(uint256 indx) external view returns (address) {
        return swapFarmLib.basketAddress(indx);
    }

    function basketAllocation(address swpBasketAddr) external view returns (uint256) {
        return swapFarmLib.basketAllocation(swpBasketAddr);
    }
}