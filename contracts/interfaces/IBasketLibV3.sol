// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

interface IBasketLibV3 {

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
        bool acceptingDeposit;
    }

    // SPDX-License-Identifier: MIT

    /// @notice set price oracle
    function setPriceOracle(address kpoaddress) external;

    /// @notice set governance token incentive multiplier
    function setGovernanceToken(address token_, uint256 multiplier) external;

    /// @notice get depositIncentiveMultiplier
    function depositIncentiveMultiplier() external view returns (uint256);
    
    // get withdrawIncentiveMultiplier
    function withdrawIncentiveMultiplier() external view returns (uint256);

    // get withdrawCostMultiplier
    function withdrawCostMultiplier() external view returns (uint256);

    /// @notice modify incentive multiplier
    function setDepositIncentiveMultiplier(uint256 multiplier) external;

    /// @notice modify withdraw incentive multiplier
    function setWithdrawIncentiveMultiplier(uint256 multiplier) external;

    /// @notice set/modify active constituent withdraw cost multiplier
    function setWithdrawCostMultiplier(uint256 multiplier) external;

    /// @notice price oracle address
    function setPriceOracleAddress(address priceoracleAddr) external;

    /// @notice add constituent to a basket
    function addConstituent(address conaddr, uint8 weight, uint8 weighttol) external;

    // @notice activate constituent
    function activateConstituent(address conaddr) external;

    /// @notice remove constituent
    function removeConstituent(address conaddr) external;

    /// @notice update constituent changes weight and weight tolerance after rebalancing to manager constituent weight close to desired
    function updateConstituent(address conaddr, uint8 weight, uint8 weightTolerance) external;

    /// @notice external call to depoit tokens to basket and receive equivalent basket tokens
    function makeDepositCheck(address conaddr, uint256 numberoftokens) external view returns (bool);

    /// @notice exchange basket tokens for removed constituent tokens
    function withdrawInactiveCheck(address conaddr, uint256 numberoftokens) external view returns(bool);

    /// @notice exchange basket tokens for active constituent tokens
    function withdrawActiveCheck(address conaddr, uint256 numberoftokens) external view returns(bool);

    /// @notice update add constituent deposit value after makedeposit
    function AddDeposit(address conaddr, uint256 numberoftokens) external;

    /// @notice update substract constituent deposit value after withdraw
    function SubDeposit(address conaddr, uint256 numberoftokens) external;
    
    /// @notice get deposit threshold
    function depositThreshold() external view returns (uint256);

    /// @notice update deposit threshold
    function updateDepositThreshold(uint256 depositthreshold) external;

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) external view returns (address, uint8, uint8, bool, uint256, uint8);

    // /// @notice get all constituents including active and inactive
    // function constituents(address) external view returns (Constituent memory);

    /// @notice get all constituents including active and inactive
    function constituentAddress(uint16) external view returns (address);

    /// @notice get all constituents including active and inactive
    function constituentStatus(address conaddr) external view returns (bool);

    function numberOfConstituents() external view returns (uint16);

    /// @notice get only # of active constituents
    function numberOfActiveConstituents() external view returns (uint16);

    function constituentPrice(address conaddr) external view returns (uint256, uint8);

    /// @notice get total deposit in $
    function totalDeposit() external view returns(uint256);

    /// @notice get price of one token of the basket
    function tokenPrice() external view returns (uint256);

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256);
        
    /// @notice if deposits can be made for a constituents
    function acceptingDeposit(address conaddr) external view returns (bool);

    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) external view returns (bool);

    /// @notice get governance token address
    function governanceToken() external view returns (address);

    /// @notice get number of incentive tokens for $ deposit
    function depositIncentive(uint256 dollaramount, address conaddr) external view returns (uint256);

    /// @notice get number of incentive tokens for $ withdrawn
    function withdrawIncentive(uint256 dollaramount, address conaddr) external view returns (uint256);

    /// @notice get number of tokens to depost inorder to withdraw from active constituent
    function withdrawCost(uint256 longdollaramount, address conaddr) external view returns (uint256);


}