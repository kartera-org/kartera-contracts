// SPDX-License-Identifier: MIT

// Copied and modified from https://github.com/Uniswap/governance/blob/master/contracts/TreasuryVester.sol

pragma solidity  >=0.4.22 <0.8.0;
// pragma solidity ^0.5.16;

// import "./SafeMath.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract TreasuryVestor {
    using SafeMath for uint;

    // address public uni;
    address public kart;
    address public recipient;

    uint public vestingAmount;
    uint public vestingBegin;
    uint public vestingCliff;
    uint public vestingEnd;

    uint public lastUpdate;

    constructor(
        // address uni_,
        address kart_,
        address recipient_,
        uint vestingAmount_,
        uint vestingBegin_,
        uint vestingCliff_,
        uint vestingEnd_
    ) public {
        require(vestingBegin_ >= block.timestamp, 'TreasuryVester::constructor: vesting begin too early');
        require(vestingCliff_ >= vestingBegin_, 'TreasuryVester::constructor: cliff is too early');
        require(vestingEnd_ > vestingCliff_, 'TreasuryVester::constructor: end is too early');

        // uni = uni_;
        kart = kart_;
        recipient = recipient_;

        vestingAmount = vestingAmount_;
        vestingBegin = vestingBegin_;
        vestingCliff = vestingCliff_;
        vestingEnd = vestingEnd_;

        lastUpdate = vestingBegin;
    }

    function setRecipient(address recipient_) public {
        require(msg.sender == recipient, 'TreasuryVester::setRecipient: unauthorized');
        recipient = recipient_;
    }

    function claim() public {
        require(block.timestamp >= vestingCliff, 'TreasuryVester::claim: not time yet');
        uint amount;
        if (block.timestamp >= vestingEnd) {
            // amount = IUni(uni).balanceOf(address(this));
            amount = IKart(kart).balanceOf(address(this));
        } else {
            amount = vestingAmount.mul(block.timestamp - lastUpdate).div(vestingEnd - vestingBegin);
            lastUpdate = block.timestamp;
        }
        // IUni(uni).transfer(recipient, amount);
        IKart(kart).transfer(recipient, amount);
    }
}

// interface IUni {
interface IKart {
    function balanceOf(address account) external view returns (uint);
    function transfer(address dst, uint rawAmount) external returns (bool);
}