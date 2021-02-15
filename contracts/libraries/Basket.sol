// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/IBasket.sol";

contract Basket {

    address public karteraPriceOracleAddress;
    address basketAddress;
    IBasket basket;
    IPriceOracle karteraPriceOracle;

    constructor (address basketaddr, address kpoaddress) public {
        basketAddress = basketaddr;
        basket = IBasket(basketaddr);
        karteraPriceOracleAddress =kpoaddress;
        karteraPriceOracle = IPriceOracle(kpoaddress);
    }

    function setPriceOracle(address kpoaddress) external {
        karteraPriceOracleAddress = kpoaddress;
        karteraPriceOracle = IPriceOracle(kpoaddress);
    }

    function totalDepositInt() internal view returns(uint256) {
        
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < basket.numberOfConstituents(); i++) {
            address addr = basket.getConstituentAddress(i);
            (uint prc, uint8 decs) = getPriceInt(addr);
            uint256 x = SafeMath.mul(prc, basket.getConstituentDeposit(addr));
            x = SafeMath.div(x, power(10, decs));
            totaldeposit += x;
        }
        return totaldeposit;
    }

    function totalDepositAfter(address conaddr, uint256 numberOfTokens) internal view returns(uint256) {
        
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < basket.numberOfConstituents(); i++) {
            address addr = basket.getConstituentAddress(i);
            (uint prc, uint8 decs) = getPriceInt(addr);
            if(addr==conaddr){
                uint256 x = SafeMath.mul(prc, SafeMath.add(basket.getConstituentDeposit(addr), numberOfTokens));
                x = SafeMath.div(x, power(10, decs));
                totaldeposit += x;
            }else{
                uint256 x = SafeMath.mul(prc, basket.getConstituentDeposit(addr));
                x = SafeMath.div(x, power(10, decs));
                totaldeposit += x;
            }
        }
        return totaldeposit;
    }

    function basketPriceInt() internal view returns (uint256) {

        uint256 totaldeposit = totalDepositInt();
        if (totaldeposit > 0) {
            uint256 x = SafeMath.mul(totaldeposit, power(10, basket.decimals()));
            x = SafeMath.div(x, basket.totalSupply());
            return x;
        }
        return SafeMath.mul(basket.initialBasketValue(), power(10, basket.decimals()));
    }

    function exchangeRate(address conaddr) external view returns (uint256) {
        require(basket.getConstituentAddress(conaddr) == conaddr, 'Constituent does not exist');
        (uint prc, uint8 decs) = getPriceInt(conaddr);
        uint256 amount = SafeMath.mul(prc, power(10, basket.decimals()));
        amount = SafeMath.div(amount, power(10, decs));
        uint256 tokens = tokensForDepositInt(amount);
        return tokens;
    }

    /// @notice # of basket tokens for deposit $ amount 
    function tokensForDepositInt(uint amount) internal view returns (uint256) {
        uint256 x = SafeMath.mul(amount, power(10, basket.decimals()));
        x = SafeMath.div(x, basketPriceInt());
        return x;
    }

    /// @notice number of inactive constituent tokens for 1 basket token
    function depositsForTokens(address conaddr, uint numberoftokens) external view returns (uint256) {
        (uint prc, uint8 decs) = getPriceInt(conaddr);
        uint256 x = SafeMath.mul(numberoftokens, basketPriceInt());
        x = SafeMath.mul(x, power(10, decs));
        x = SafeMath.div(x, prc);
        return x;
    }

    /// @notice number of inactive constituent tokens for dollar amount 
    function depositsForDollar(address conaddr, uint256 dollaramount) external view returns (uint256) {
        (uint prc, uint8 decs) = getPriceInt(conaddr);
        uint256 x = SafeMath.mul(dollaramount, power(10, decs));
        x = SafeMath.div(x, prc);
        return x;
    }

    function constituentWithdrawCost(uint256 numberoftokens) external view returns (uint256){
        uint256 tokenprice = basketPriceInt();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice);
        uint256 withdrawcost = withdrawCostInt(SafeMath.div(dollaramount, power(10, basket.decimals())));
        withdrawcost = SafeMath.div(withdrawcost, power(10, basket.decimals()));
        return withdrawcost;
    }

    function acceptingDepositTest(address conaddr) external view returns (uint256) {
        require(basket.getConstituentAddress(conaddr) == conaddr, 'Constituent does not exist');
        uint256 currentweight = 0;
        uint256 totaldeposit = totalDepositInt();
        if (totaldeposit > basket.depositThreshold()){
            (uint256 prc, uint8 decs) = getPriceInt(conaddr);
            currentweight = SafeMath.mul(100, basket.getConstituentDeposit(conaddr));
            currentweight = SafeMath.mul(currentweight, prc);
            currentweight = SafeMath.div(currentweight, totaldeposit);
            currentweight = SafeMath.div(currentweight, power(10, decs));
            return currentweight;
        }else{
            return 0;
        }
        if (uint8(currentweight) < basket.getConstituentWeight(conaddr) + basket.getConstituentWeightTol(conaddr)) {
            return 0;
        }
        return 1;
    }

    function acceptingDeposit(address conaddr) external view returns (bool) {
        require(basket.getConstituentAddress(conaddr) == conaddr, 'Constituent does not exist');
        uint256 currentweight = 0;
        uint256 totaldeposit = totalDepositInt();
        if (totaldeposit > basket.depositThreshold()){
            (uint256 prc, uint8 decs) = getPriceInt(conaddr);
            currentweight = SafeMath.mul(100, basket.getConstituentDeposit(conaddr));
            currentweight = SafeMath.mul(currentweight, prc);
            currentweight = SafeMath.div(currentweight, totaldeposit);
            currentweight = SafeMath.div(currentweight, power(10, decs));
        }else{
            return true;
        }
        if (uint8(currentweight) < basket.getConstituentWeight(conaddr) + basket.getConstituentWeightTol(conaddr)) {
            return true;
        }
        return false;
    }

    function acceptingActualDeposit(address conaddr, uint256 numberOfTokens) external view returns (bool) {
        require(basket.getConstituentAddress(conaddr) == conaddr, 'Constituent does not exist');
        uint256 currentweight = 0;
        uint256 totaldeposit = totalDepositAfter(conaddr, numberOfTokens);
        if (totaldeposit > basket.depositThreshold()){
            (uint256 prc, uint8 decs) = getPriceInt(conaddr);
            currentweight = SafeMath.mul(100, SafeMath.add(basket.getConstituentDeposit(conaddr), numberOfTokens));
            currentweight = SafeMath.mul(currentweight, prc);
            currentweight = SafeMath.div(currentweight, totaldeposit);
            currentweight = SafeMath.div(currentweight, power(10, decs));
        }else{
            return true;
        }
        if (uint8(currentweight) < basket.getConstituentWeight(conaddr) + basket.getConstituentWeightTol(conaddr)) {
            return true;
        }
        return false;
    }


    function depositIncentive(uint256 dollaramount) external view returns (uint256) {
        if(basket.governanceToken() == address(0)){
            return 0;
        }
        ERC20 token = ERC20(basket.governanceToken());
        uint256 karterasupply = token.balanceOf(basketAddress);
        uint256 d = SafeMath.mul(basket.depositIncentiveMultiplier(), dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    function withdrawIncentive(uint256 dollaramount) external view returns (uint256) {

        if(basket.governanceToken() == address(0)){
            return 0;
        }
        ERC20 token = ERC20(basket.governanceToken());
        uint256 karterasupply = token.balanceOf(basketAddress);
        uint256 d = SafeMath.mul(basket.withdrawIncentiveMultiplier(), dollaramount);
        if(karterasupply >= d){
            return d;
        }else{
            return karterasupply;
        }
    }

    function withdrawCostInt(uint256 longdollaramount) internal view returns (uint256) {
        require(basket.governanceToken() != address(0), 'cannot withdraw');
        uint256 d = SafeMath.mul(basket.withdrawCostMultiplier(), longdollaramount);
        return d;
    }

    function withdrawCost(uint256 longdollaramount) external view returns (uint256) {
        return withdrawCostInt(longdollaramount);
    }

    function getPriceInt(address conaddr) internal view returns (uint256, uint8) {
        (uint256 prc, uint8 decimals) = karteraPriceOracle.price(conaddr);
        return (prc, decimals);
    }

    function basketPrice() external view returns (uint256) {
        return basketPriceInt();
    }
 
    function getPrice(address conaddr) external view returns (uint256, uint8) {
        return getPriceInt(conaddr);
    }

    function totalDeposit() external view returns(uint256) {
        return totalDepositInt();
    }

    function tokensForDeposit(uint amount) external view returns (uint256) {
        return tokensForDepositInt(amount);
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }

}