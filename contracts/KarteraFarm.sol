// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./interfaces/IPriceOracle.sol";
import "./SwapBasket.sol";
import "./KarteraToken.sol";

// Deposit kartera token here to receive xKart tokens and get rewards in wEth
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.
contract KarteraFarm is ERC20("Kartera Farm Token", "xKART"){
    using SafeMath for uint256;
    address karteraTokenAddress;
    KarteraToken public kart;
    address[] baskets;
    IPriceOracle karteraPriceOracle;
    // flag to request price from oracle can only be set true 
    // default price is $0.00001
    bool public exPrice = false;

    address public manager;

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    constructor(address karteraTokenAddr, address priceOracle) public {
        manager = msg.sender;
        karteraTokenAddress = karteraTokenAddr;
        kart = KarteraToken(karteraTokenAddr);
        karteraPriceOracle = IPriceOracle(priceOracle);
    }

    function setUseExPrice() external onlyManager {
        exPrice = true;
    }

    function setPriceOracle(address priceOracle) external onlyManager {
        karteraPriceOracle = IPriceOracle(priceOracle);
    }

    function transferManager(address newmanager) external onlyManager {
        manager = newmanager;
    }

    function numberOfBaskets () external view returns (uint256) {
        return baskets.length;
    }

    function addBasket(address basketaddr) external onlyManager{
        for(uint256 i=0; i<baskets.length; i++) {
            if(baskets[i]==basketaddr)
            {
                return;
            }
        }
        baskets.push(basketaddr);
    }

    function basketValue (uint256 indx) public view returns (uint256 value) {
        SwapBasket swapbasket = SwapBasket(baskets[indx]);
        uint256 bal = swapbasket.balanceOf(address(this));
        value = bal.mul(swapbasket.basketTokenPrice()).div(1e18);
    }

    function basketsValue () internal view returns (uint256 totalvalue) {
        totalvalue = 0;
        for(uint256 i=0; i<baskets.length; i++) {
            totalvalue = totalvalue.add(basketValue(i));
        }
    }

    function kartValue (uint tokens) public view returns (uint256 value) {
        uint256 prc = 1e13;
        uint8 dec = 18;
        if(exPrice){
            (prc,  dec) = karteraPriceOracle.price(karteraTokenAddress);
        }
        value = prc.mul(tokens).div(power(10, dec));
    }

    function xKartPrice () public view returns (uint256 value) {
        value = totalAssetValue().mul(1e18).div(totalSupply());
    }

    function totalAssetValue () public view returns (uint256 value) {
        uint kartBal = kart.balanceOf(address(this));
        value = kartValue(kartBal) + basketsValue();
    }

    // Deposit your kart token here and start earning rewards
    function deposit(uint256 numberOfKart) external {
        // use dollar value of all baskets + exiting xKart in farm to issue new xKart
        uint256 totalvalue = totalAssetValue();
        
        uint256 totalsupply = totalSupply();
        // If totalvalue=0 or totalsupply = 0 mint 1:1 Kart:xKart
        if (totalvalue == 0 || totalsupply == 0) {
            _mint(msg.sender, numberOfKart);
        } 
        else {
            uint256 xkartreceived = kartValue(numberOfKart).mul(totalsupply).div(totalvalue);
            _mint(msg.sender, xkartreceived);
        }
        kart.transferFrom(msg.sender, address(this), numberOfKart);
    }

    // Leave the farm and claim rewards
    // burns xKART
    function withdraw(uint256 numberoftokens) external {
        uint256 totalsupply = totalSupply();
        uint256 totalValue = totalAssetValue();
        uint256 kartBal = kart.balanceOf(address(this));
        uint256 lockedKartVal = kartValue(kartBal);
        // value of tokens sent : tokens*value of xKart
        uint256 xKartVal = numberoftokens.mul(xKartPrice()).div(1e18);
        _burn(msg.sender, numberoftokens);
        if(xKartVal <= lockedKartVal){
            uint256 tokensredeemed = xKartVal.mul(1e18).div(kartValue(1e18));    
            kart.transfer(msg.sender, tokensredeemed);
        }
        else{
            kart.transfer(msg.sender, kartBal);
            xKartVal = xKartVal.sub(lockedKartVal);
            for(uint256 i=0; i<baskets.length; i++){
                SwapBasket swapbasket = SwapBasket(baskets[i]);
                uint256 bVal = basketValue(i);
                if(xKartVal <= bVal){
                    uint256 tokensredeemed = xKartVal.mul(1e18).div(swapbasket.basketTokenPrice());
                    swapbasket.transfer(msg.sender, tokensredeemed);
                    break;
                }else{
                    uint256 tokensredeemed = swapbasket.balanceOf(address(this));
                    swapbasket.transfer(msg.sender, tokensredeemed);
                    xKartVal = xKartVal.sub(bVal);
                }
            }

        }
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}
