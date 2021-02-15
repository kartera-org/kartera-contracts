// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

/// @title IBasket 
interface IBasket {

    /// @notice external call to depoit tokens to basket and receive equivalent basket tokens
    function makeDeposit(address conaddr, uint256 numberoftokens) external payable returns (uint256, uint256);

    /// @notice exchange basket tokens for removed constituent tokens
    function withdrawInactive(address conaddr, uint256 numberoftokens) external payable returns(uint256);

    /// @notice exchange basket tokens for active constituent tokens
    function withdrawActive(address conaddr, uint256 numberoftokens) external payable returns(uint256);

    /// @notice get details of the constituent
    function getConstituentDetails(address conaddr) external view returns (address, uint8, uint8, bool, uint256, uint8);

    /// @notice get all constituents including active and inactive
    function getConstituentStatus(address conaddr) external view returns (bool);

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view returns (uint256);

    /// @notice gets number of constituents
    function numberOfConstituents() external view returns (uint16);

    /// @notice gets number of active constituents
    function numberOfActiveConstituents() external view returns (uint16);

    /// @notice gets constituent address
    function getConstituentAddress(uint8) external view returns (address);

    /// @notice gets constituent address
    function getConstituentAddress(address) external view returns (address);

    /// @notice gets constituent deposit
    function getConstituentDeposit(address) external view returns (uint256);

    /// @notice gets constituent deposit
    function decimals() external view returns (uint8);

    /// @notice gets total supply
    function totalSupply() external view returns (uint256);

    /// @notice get inital basket price
    function initialBasketValue() external view returns (uint256);

    /// @notice get deposit incentive multiplier
    function depositIncentiveMultiplier() external view returns (uint256);

    /// @notice get withdraw incentive multiplier
    function withdrawIncentiveMultiplier() external view returns (uint256);

    /// @notice get withdraw cost multiplier
    function withdrawCostMultiplier() external view returns (uint256);

    /// @notice get gov token address
    function governanceToken() external view returns (address);

    /// @notice get deposit threshold
    function depositThreshold() external view returns (uint256);

    /// @notice get constituent weight
    function getConstituentWeight(address) external view returns (uint8);

    /// @notice get constituent weight tol
    function getConstituentWeightTol(address) external view returns (uint8);


}
