// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

interface ISwapFarmLib {
    /** 
        //liquidity provider info
        uint256 amount; // number of swap basket tokens deposited
        uint256 recieved; // number of incentives received
    */

    struct LPInfo{
        uint256 deposits;
        uint256 adjustment;
    }

    /**
        struct BasketInfo {
            address swapbasketAddress; // address of swap basket
            uint256 allocation; // number of tokens per block
            uint256 lastAllocBlock; // last allocation block
            uint256 tokensPerBasket; // tokens accumulated per swap basket share
    }
    */

    struct SwapBasketInfo {
        address swapBasketAddress;
        uint256 id;
        uint256 allocation;
        uint256 lastUpdateBlock;
        uint256 tokensPerShare;
    }

    function numberOfBaskets() external view returns (uint256);

    function basketAddress(uint256) external view returns (address);
 
    function setRewardsPerBlock(uint256 rewardsperblock) external;

    function addBasket(address swpaddr, uint256 allocation_) external;
    
    function modifyBasket(address swpaddr, uint256 allocation_) external;

    function accumulatedRewards(address lpAddr, address swpaddr) external view returns (uint256);

    function resetBasket(address addr) external returns (uint256 minttobasket);

    function deposit(address lpuser, address swpaddr, uint256 numberoflptokens) external returns (uint256 accumulatedrewards);

    function withdraw(address lpuser, address swpaddr, uint256 numberoflptokens) external returns(uint256 accumulatedrewards);

    function withdrawAll(address lpuser, address swpaddr) external returns (uint256 accumulatedrewards, uint256 deposits);
    
    function collectRewards(address lpuser, address swpaddr) external returns (uint256 accumulatedrewards);

    function lockedTokens(address lpuser, address swpaddr) external view returns (uint256);

    function basketAllocation(address swpaddr) external view returns (uint256);
}