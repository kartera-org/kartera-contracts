// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract BasketFarm {
    using SafeMath for uint256;
    // lpholder => amount => blocktime
    mapping ( address => mapping ( uint256 => uint256 ) ) lpMap;

    constructor() public {
        
    }

    function deposit() external {

    }
}