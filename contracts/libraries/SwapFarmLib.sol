// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/ISwapFarmLib.sol";

contract SwapFarmLib is ISwapFarmLib {
    using SafeMath for uint256;

    mapping (address => SwapBasketInfo) swapBasketsMap;
    mapping (uint256 => address) public override basketAddress;
    uint256 public override numberOfBaskets;

    mapping (address => mapping (address => LPInfo)) basketLPMap;

    uint256 public rewardsStartBlock;
    uint256 public bonusEndBlock;
    uint256 public constant bonusRewardsMultiplier = 10;
    uint256 totalAllocations = 0;

    // rewards per block
    uint256 public rewardsPerBlock;

    uint256 decimals = 1e18;

    address public manager;
   
    constructor(address swapFarm , uint256 rewardsperblock, uint256 startblock, uint256 endblock) public {
        manager = swapFarm;
        rewardsPerBlock = rewardsperblock;
        rewardsStartBlock = startblock;
        bonusEndBlock = endblock;
    }

    function setRewardsPerBlock(uint256 rewardsperblock) external override {
        require(msg.sender == manager, 'Not manager');
        require(rewardsperblock<rewardsPerBlock, 'Rewards can only be lowered');
        rewardsPerBlock = rewardsperblock;
    }

    function addBasket(address swpBasketAddr, uint256 allocation_) external override {
        require(msg.sender== manager, 'Not manager');
        require(swapBasketsMap[swpBasketAddr].swapBasketAddress != swpBasketAddr, 'Swap Basket already exits');

        uint256 lastUpdateBlock = block.number > rewardsStartBlock ? block.number : rewardsStartBlock;

        totalAllocations = totalAllocations.add(allocation_);

        swapBasketsMap[swpBasketAddr].swapBasketAddress = swpBasketAddr;
        swapBasketsMap[swpBasketAddr].allocation = allocation_;
        swapBasketsMap[swpBasketAddr].id = numberOfBaskets;
        swapBasketsMap[swpBasketAddr].lastUpdateBlock = lastUpdateBlock;
        swapBasketsMap[swpBasketAddr].tokensPerShare = 0;
        basketAddress[numberOfBaskets] = swpBasketAddr;
        numberOfBaskets++;
    }
    
    function modifyBasket(address swpBasketAddr, uint256 allocation_) external override {
        require(msg.sender== manager, 'Not manager ');
        require(swapBasketsMap[swpBasketAddr].swapBasketAddress == swpBasketAddr, 'Basket does not exit');

        totalAllocations = totalAllocations.sub(swapBasketsMap[swpBasketAddr].allocation).add(allocation_);

        swapBasketsMap[swpBasketAddr].swapBasketAddress = swpBasketAddr;
        swapBasketsMap[swpBasketAddr].allocation = allocation_;
        swapBasketsMap[swpBasketAddr].id = numberOfBaskets;
        basketAddress[numberOfBaskets] = swpBasketAddr;
        numberOfBaskets++;
    }

    function rewardsMultiplier(uint256 _start, uint256 _end) internal view returns (uint256) {
        if(_start >= bonusEndBlock) {
            return _end.sub(_start);
        } else if (_end <= bonusEndBlock) {
           return _end.sub(_start).mul(bonusRewardsMultiplier);
        } else {
            return bonusEndBlock.sub(_start).mul(bonusRewardsMultiplier).add(_end.sub(bonusEndBlock));
        }
    }

    function _resetBasket(address swpBasketAddr) internal returns (uint256 minttobasket) {
        SwapBasketInfo storage swpBasketInfo = swapBasketsMap[swpBasketAddr];
        if(block.number <= swpBasketInfo.lastUpdateBlock) {
            return (0);
        }

        IERC20 swpTkn = IERC20(swpBasketAddr);
        uint256 deposits = swpTkn.balanceOf(manager);
        if(deposits == 0 ) {
            swpBasketInfo.lastUpdateBlock = block.number;
            return (0);
        }
        uint256 multiplier = rewardsMultiplier(swpBasketInfo.lastUpdateBlock, block.number);
        uint256 rewards = multiplier.mul(rewardsPerBlock).mul(swpBasketInfo.allocation).div(totalAllocations);
        minttobasket = rewards;
        
        swpBasketInfo.tokensPerShare = swpBasketInfo.tokensPerShare.add(rewards.mul(decimals).div(deposits));
        swpBasketInfo.lastUpdateBlock = block.number;        
    }

    function resetBasket(address addr) external override returns (uint256 minttobasket) {
        minttobasket = _resetBasket(addr);
    }

    function deposit(address lpuser, address swpBasketAddr, uint256 numberoflptokens) external override returns (uint256 accumulatedrewards){
        require(msg.sender== manager, 'Not manager ');
        SwapBasketInfo storage swpBasketInfo = swapBasketsMap[swpBasketAddr];
        LPInfo storage lpinfo = basketLPMap[swpBasketAddr][lpuser];
        accumulatedrewards = 0;
        if(lpinfo.deposits > 0) {
            accumulatedrewards = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).sub(lpinfo.adjustment);
        }
        lpinfo.deposits = lpinfo.deposits.add(numberoflptokens);
        lpinfo.adjustment = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).div(decimals);
    }

    function withdraw(address lpuser, address swpBasketAddr, uint256 numberoflptokens) external override returns(uint256 accumulatedrewards) {
        require(msg.sender== manager, 'Not manager ');
        SwapBasketInfo storage swpBasketInfo = swapBasketsMap[swpBasketAddr];
        LPInfo storage lpinfo = basketLPMap[swpBasketAddr][lpuser];
        require(lpinfo.deposits >= numberoflptokens, "Withdraw exceeds deposits");
        accumulatedrewards = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).div(decimals).sub(lpinfo.adjustment);
        lpinfo.deposits = lpinfo.deposits.sub(numberoflptokens);
        lpinfo.adjustment = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).div(decimals);
    }

    function withdrawAll(address lpuser, address swpBasketAddr) external override returns ( uint256 deposits, uint256 accumulatedrewards) {
        require(msg.sender== manager, 'Not manager ');
        SwapBasketInfo storage swpBasketInfo = swapBasketsMap[swpBasketAddr];
        LPInfo storage lpinfo = basketLPMap[swpBasketAddr][lpuser];
        require(lpinfo.deposits > 0, "Nothing to withdraw");
        accumulatedrewards = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).sub(lpinfo.adjustment);
        deposits = lpinfo.deposits;
        lpinfo.deposits = 0;
        lpinfo.adjustment = 0;
    }

    function accumulatedRewards(address lpAddr, address swpBasketAddr) external view override returns (uint256){
        SwapBasketInfo storage basketinfo = swapBasketsMap[swpBasketAddr];
        LPInfo storage lpinfo = basketLPMap[swpBasketAddr][lpAddr];
        uint256 accumulatedrewards = basketinfo.tokensPerShare;
        if(lpinfo.deposits==0){
            return 0;
        }
        IERC20 basketToken = IERC20(swpBasketAddr);
        uint256 lpSupply = basketToken.balanceOf(manager);
        if (block.number > basketinfo.lastUpdateBlock && lpSupply != 0) {
            uint256 multiplier = rewardsMultiplier(basketinfo.lastUpdateBlock, block.number);
            uint256 rewards = multiplier.mul(rewardsPerBlock).mul(basketinfo.allocation).div(totalAllocations);
            accumulatedrewards = accumulatedrewards.add(rewards.mul(decimals).div(lpSupply));
        }
        return lpinfo.deposits.mul(accumulatedrewards).div(decimals).sub(lpinfo.adjustment);
    }

    function collectRewards(address lpuser, address swpBasketAddr) external override returns (uint256 accumulatedrewards) {
        require(msg.sender== manager, 'Not manager ');
        SwapBasketInfo storage swpBasketInfo = swapBasketsMap[swpBasketAddr];
        LPInfo storage lpinfo = basketLPMap[swpBasketAddr][lpuser];
        require(lpinfo.deposits > 0, "Nothing to withdraw");
        accumulatedrewards = lpinfo.deposits.mul(swpBasketInfo.tokensPerShare).div(decimals).sub(lpinfo.adjustment);
        lpinfo.adjustment = lpinfo.adjustment.add(accumulatedrewards);
    }

    function lockedTokens(address lpuser, address swpBasketAddr) external view override returns (uint256) {
        return basketLPMap[swpBasketAddr][lpuser].deposits;
    }

    function basketAllocation(address swpBasketAddr) external view override returns (uint256) {
        return swapBasketsMap[swpBasketAddr].allocation;
    }

}