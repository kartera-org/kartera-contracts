// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockSushi is ERC20('SUSHI Mock Token', 'mSUSHI'), Ownable{
    uint _counter;
    uint256 _totalSupply;
    constructor() public{
        _counter = 0;
        _totalSupply=1000000000000000000000000000;
        _mint(msg.sender, _totalSupply);
    }
}