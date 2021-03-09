// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Deposit kartera token here to receive xKart tokens and get rewards in wEth
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.
contract KarteraFarm is ERC20("Kartera Farm", "xKART"){
    using SafeMath for uint256;
    IERC20 public karteraToken;
    address[] baskets;

    address public manager;

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner());
        _;
    }

    constructor(address karteraTokenAddr) public {
        manager = msg.sender;
        karteraToken = IERC20(karteraTokenAddr);
    }

    function transferManager(address newmanager) external onlyManagerOrOwner {
        manager = newmanager;
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

    function basketsValue () internal returns (uint256) {
        uint256 totalvalue = 0;
        for(uint256 i=0; i<baskets.length; i++) {
            SwapBasket swapbasket = SwapBasket(baskets[i]);
            uint256 bal = swapbasket.balanceOf(address(this));
            totalvalue += bal.mul(swaplib.basketTokenPrice());
        }
        return totalvalue;
    }

    // Deposit your kart token here and start earning rewards
    function deposit(uint256 numberOfKart) public {
        // use dollar value of all baskets + exiting xKart in farm to issue new xKart
        uint256 totalvalue = basketsValue();
        
        uint256 totalsupply = totalSupply();
        // If totalvalue=0 or totalsupply = 0 mint it 1:1 xKart
        if (totalvalue == 0 || totalsupply == 0) {
            _mint(msg.sender, numberOfKart);
        } 
        else {
            uint256 xkartreceived = numberOfKart.mul(totalsupply).div(totalvalue);
            _mint(msg.sender, xkartreceived);
        }
        // Lock the Sushi in the contract
        sushi.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SUSHIs.
    // Unclocks the staked + gained Sushi and burns xSushi
    function withdraw(uint256 _share) public {
        // Gets the amount of xSushi in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sushi the xSushi is worth
        uint256 what = _share.mul(sushi.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        sushi.transfer(msg.sender, what);
    }
}

interface SwapBasket {
    function basketTokenPrice() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
}