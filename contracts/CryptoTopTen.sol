// SPDX-License-Identifier: MIT
pragma solidity  >=0.4.22 <0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract CryptoTopTen is ERC20('Crypto Top Ten', 'CTT'), Ownable{
    struct Constituent{
        address contractAddress;
        uint8   weight;
        uint256 totalDeposit;
        uint8   weightTolerance;
        uint8   id;
        bool    active;
    }
    uint8   private  _numberOfConstituents = 0;
    uint    private  _initialContractValue = 1000;
    uint256 private  _divisor = 1;
    mapping(address => Constituent) private constituents;
    mapping(uint8 => address) private contractAddress;
    function Invest(address tokenaddr, uint256 amount) public payable {

        ERC20 token = ERC20(tokenaddr);        
        token.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }
    function NumberOfConstituents() public view returns(uint){
        return _numberOfConstituents;
    }
    function NumberOfActiveConstituents() public view returns(uint){
        uint activecons = 0;
        for(uint8 i=0; i<_numberOfConstituents; i++){
            address addr = contractAddress[i];
            if(constituents[addr].active){
                activecons++;
            }
        }
        return activecons;
    }
    function ConstituentPrice(address addr) public pure returns (uint256) {
        return 1;
    }
    function TotalDeposit() public view returns(uint256){
        uint256 totaldeposit = 0;
        for(uint8 i=0; i<_numberOfConstituents; i++){
            address addr = contractAddress[i];
            totaldeposit += ConstituentPrice(addr) * constituents[addr].totalDeposit;
        }
        return totaldeposit;
    }
    function SetWeightTolerance(address conaddr, uint8 tol) public onlyOwner{
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].weightTolerance = tol;
    }
    function WeightTolerance(address conaddr) public view returns(uint){
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        return constituents[conaddr].weightTolerance;
    }
    function AddConstituent(address conaddr, uint8 weight_) public onlyOwner{
        require(constituents[conaddr].contractAddress != conaddr || !constituents[conaddr].active, "Contract already exists and is active");
        constituents[conaddr].contractAddress = conaddr;
        constituents[conaddr].weight = weight_;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].id = _numberOfConstituents;
        contractAddress[_numberOfConstituents] = conaddr;
        _numberOfConstituents++;

    }
    function RemoveConstituent(address conaddr) public onlyOwner{
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].active = false;
    }
    function UpdateConstituent(address conaddr, uint8 weight_) public onlyOwner{

        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        constituents[conaddr].weight = weight_;
    }
    function ConstituentWeight(address conaddr) public view returns(uint){
        return constituents[conaddr].weight;
    }
    function TokenPrice() public view returns (uint256) {
        uint256 totaldeposit = TotalDeposit();
        if(totaldeposit>0)
        {
            return TotalDeposit() / _divisor;
        }
        return _initialContractValue;
    }
    function TokensForDeposit(uint amount) public view returns (uint256) {
        return power(10, 18) * amount / TokenPrice();
    }
    function Divisor() public view returns (uint256) {
        return _divisor;
    }
    function NewDivisor(uint256 amount) public view returns (uint256) {
        uint256 totaldeposit = TotalDeposit();
        if(totaldeposit>0){
            return _divisor * (totaldeposit + amount) / totaldeposit;
        }
        return amount / _initialContractValue;
    }
    function UpdateDivisor(uint256 d) private {
        _divisor = d;
    }
    function AcceptingDeposit(address conaddr) public view returns (bool){
        require(constituents[conaddr].contractAddress == conaddr && constituents[conaddr].active, "Contract does not exist or is not active");
        uint currentweight=0;
        uint256 totaldeposit = TotalDeposit();
        if(totaldeposit>0)
        {
            currentweight = constituents[conaddr].totalDeposit / totaldeposit;
        }else{
            return true;
        }
        if(currentweight < constituents[conaddr].weight + constituents[conaddr].weightTolerance){
            return true;
        }
        return false;
    }
    function MakeDeposit(address conaddr, uint256 numberoftokens) public payable {
        require(constituents[conaddr].contractAddress == conaddr, "Contract does not exist");
        bool acceptingDeposits = AcceptingDeposit(conaddr);
        require(acceptingDeposits, 'No further deposits accepeted for this contract');
        uint256 amount = numberoftokens * ConstituentPrice(conaddr);
        uint256 divisor = NewDivisor(amount);
        uint256 minttokens = TokensForDeposit(amount);
        console.log('minting tokens for deposit: ', minttokens );
        ERC20 token = ERC20(conaddr);
        token.transferFrom(msg.sender, address(this), numberoftokens);
        console.log(' tokens transferred ');
        _mint(msg.sender, minttokens);
        UpdateDivisor(divisor);
    }
    function power(uint256 a, uint8 b) public pure returns(uint256)
    {
        return a**b;
    }

}