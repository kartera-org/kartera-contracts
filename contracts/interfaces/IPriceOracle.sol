// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;


interface IPriceOracle {
    function price(address tknaddress) view external returns (uint256, uint8);
}