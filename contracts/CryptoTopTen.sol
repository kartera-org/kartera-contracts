// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract CryptoTopTen is ERC20("Crypto Top Ten", "CTT"), Ownable {
    struct Constituent{
        address contractAddress;
        uint8 weight;
        uint8 weightTolerance;
        uint8 id;
        bool active;
        uint256 totalDeposit;
    }
    uint8   _numberOfConstituents = 0;
    uint   _initialContractValue = 1000;
    uint256   _divisor = 1;
    mapping(address => Constituent)  constituents;
    mapping(uint8 => address)  contractAddress;

    function addConstituent(address conaddr, uint8 weight_) external onlyOwner {
        require(constituents[conaddr].contractAddress != conaddr || !constituents[conaddr].active, "Contract already exists and is active");
        constituents[conaddr].contractAddress = conaddr;
        constituents[conaddr].weight = weight_;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].id = _numberOfConstituents;
        contractAddress[_numberOfConstituents] = conaddr;
        _numberOfConstituents++;

    }

    function removeConstituent(address conaddr) public onlyOwner{
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].active = false;
    }

    function updateConstituent(address conaddr, uint8 weight_) external onlyOwner{

        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].weight = weight_;
    }

    function makeDeposit(address conaddr, uint256 numberoftokens) external payable {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        bool acceptingDeposits = acceptingDeposit(conaddr);
        require(acceptingDeposits, "No further deposits accepeted for this contract");
        uint256 amount = numberoftokens * constituentPrice(conaddr);
        uint256 d = newDivisor(amount);
        uint256 minttokens = tokensForDeposit(amount);
        ERC20 token = ERC20(conaddr);
        token.transferFrom(msg.sender, address(this), numberoftokens);
        _mint(msg.sender, minttokens);
        updateDivisor(d);
    }

    function numberOfConstituents() public view returns(uint) {
        return _numberOfConstituents;
    }

    function numberOfActiveConstituents() public view returns(uint) {
        uint activecons = 0;
        for(uint8 i = 0; i < _numberOfConstituents; i++) {
            address addr = contractAddress[i];
            if (constituents[addr].active) {
                activecons++;
            }
        }
        return activecons;
    }

    function constituentPrice(address addr) public pure returns (uint256) {
        return 1;
    }

    function totalDeposit() public view returns(uint256) {
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < _numberOfConstituents; i++) {
            address addr = contractAddress[i];
            totaldeposit += constituentPrice(addr) * constituents[addr].totalDeposit;
        }
        return totaldeposit;
    }

    function weightTolerance(address conaddr) public view returns(uint) {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        return constituents[conaddr].weightTolerance;
    }

    function constituentWeight(address conaddr) public view returns(uint) {
        return constituents[conaddr].weight;
    }

    function tokenPrice() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit > 0) {
            return totalDeposit() / _divisor;
        }
        return _initialContractValue;
    }

    function tokensForDeposit(uint amount) public view returns (uint256) {
        return power(10, 18) * amount / tokenPrice();
    }

    function divisor() public view returns (uint256) {
        return _divisor;
    }

    function newDivisor(uint256 amount) public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit>0) {
            return _divisor * (totaldeposit + amount) / totaldeposit;
        }
        return amount / _initialContractValue;
    }

    function acceptingDeposit(address conaddr) public view returns (bool) {
        require(constituents[conaddr].contractAddress == conaddr && constituents[conaddr].active, "Contract does not exist or is not active");
        uint currentweight = 0;
        uint256 totaldeposit = totalDeposit();
        if (totaldeposit>0) {
            currentweight = constituents[conaddr].totalDeposit / totaldeposit;
        }else{
            return true;
        }
        if (currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance) {
            return true;
        }
        return false;
    }

    function updateDivisor(uint256 d) internal {
        _divisor = d;
    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}