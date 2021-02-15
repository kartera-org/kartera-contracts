// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;


interface IBasketLib {
    function basketPrice() external view returns (uint256);
    function getPrice(address conaddr) external view returns (uint256, uint8);
    function exchangeRate(address conaddr) external view returns (uint256);
    function depositsForTokens(address conaddr, uint numberoftokens) external view returns (uint256);
    function depositsForDollar(address conaddr, uint256 dollaramount) external view returns (uint256);
    function constituentWithdrawCost(uint256 numberoftokens) external view returns (uint256);
    function acceptingDeposit(address conaddr) external view returns (bool);
    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) external view returns (bool);
    function depositIncentive(uint256 dollaramount) external view returns (uint256);
    function withdrawIncentive(uint256 dollaramount) external view returns (uint256);
    function withdrawCost(uint256 longdollaramount) external view returns (uint256);
    function totalDeposit() external view returns(uint256);
    function tokensForDeposit(uint amount) external view returns (uint256);
}