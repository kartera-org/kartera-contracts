// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

interface ISwapLib {
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
        uint16 id;
        bool active;
        uint256 totalDeposit;
        uint8 decimals;
    }

    // SPDX-License-Identifier: MIT

    /// @notice set price oracle
    function setPriceOracle(address kpoaddress) external;

    /// @notice set swap fees
    function setSwapFees(uint16 _fee, uint16 _govfee) external;

    /// @notice add constituent to a basket
    function addConstituent(address conaddr) external;

    // @notice activate constituent
    function activateConstituent(address conaddr) external;

    /// @notice remove constituent
    function removeConstituent(address conaddr) external;

    /// @notice external call to depoit tokens to basket and receive equivalent basket tokens
    function addLiquidity(address conaddr, uint256 numberoftokens) external returns (uint256);

    /// @notice exchange basket tokens for constituent tokens
    function withdrawLiquidity(address conaddr, uint256 numberoftokens) external returns(uint256, uint256);
    
    /// @notice get all constituents including active and inactive
    function constituentAddress(uint16) external view returns (address);

    /// @notice get only # of constituents
    function numberOfConstituents() external view returns (uint16);

    /// @notice get only # of active constituents
    function numberOfActiveConstituents() external view returns (uint16);

    /// @notice get constituents
    function constituentInfo(address) external view returns (address, bool, uint256, uint8);

    /// @notice get price active constituents from price oracle
    function constituentPrice(address conaddr) external view returns (uint256, uint8);

    /// @notice get total deposit in $
    function totalDeposit() external view returns(uint256);

    /// @notice get price of one token of the basket
    function basketTokenPrice() external view returns (uint256);

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256);
        
    /// @notice get fee to swap one token for another
    function fee() external view returns (uint16);

    /// @notice portion of fee allocated to gov contract
    function govFee() external view returns (uint16);

    /// @notice withdraw cost in kartera tokens per $100
    function withdrawCostMultiplier() external view returns(uint256);

    /// @notice set withdrawcostmultiplier 
    function setWithdrawCostMultiplier(uint256 withdrawcostmultiplier) external;

    /// @notice get withdrawCost for number of basket tokens
    function withdrawCost(uint256 numberOfBasketTokens) external view returns (uint256);

    /// @notice swap limit per trade 
    function swapLimit() external view returns (uint8);

    /// @notice swap tokenA for tokenB
    function swap(address tokenA, address tokenB, uint256 amount) external returns (uint256, uint256);

    /// @notice get swap rate for 1 tokenA to tokenB
    function swapRate(address tokenA, address tokenB) external view returns (uint256);

}