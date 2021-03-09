// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/ISwapLib.sol";

contract SwapLib is ISwapLib {
    using SafeMath for uint256;

    // address of manager of the library 
    address public manager;

    // ERC basket address
    address public basketaddress;

    // price oracle contract address
    address karteraPriceOracleAddress;
    IPriceOracle karteraPriceOracle;

    // price at which first token is issued
    uint256 public initialBasketValue = 100;

    uint256 public basketDecimals = 1000000000000000000;

    // total number of constituents in the basket 
    uint16 public override numberOfConstituents = 0;

    // total number of active constituents in the basket 
    uint16 public override numberOfActiveConstituents = 0;

    // map of constituents by address
    mapping (address => Constituent) public constituents;

    // map of constituent address by index
    mapping (uint16 => address) public override constituentAddress;

    // minimum # of block after with lp withdrawals does not incur fee aprox 2 day
    uint256 lpBlocksReq = 130000;

    // map of lp provider address to block time when deposited withdrawals less the x blocks will incur trading fees
    mapping (address => uint256) lpStartBlock;
    
    // total trading fee
    uint8 public override fee = 30;

    // trading fee to Gov token holders
    uint8 public override govFee = 5;

    // maximum swap amount allowed to receive
    uint8 public override swapLimit = 1;

    // internal (dummy) address for ether to add to constituents map
    address ethAddress = address(0x0000000000000000000000000000000000000001);

    /// @notice contract constructor make sender the manger and sets governance token to zero address
    constructor(address basketaddr, address kpo) public {
        manager = msg.sender;
        basketaddress = basketaddr;
        karteraPriceOracleAddress = kpo;
        karteraPriceOracle = IPriceOracle(kpo);
    }

    /// @notice transfer manager
    function transferManager(address newmanager) external {
        require(msg.sender==manager, "Only manager can assign new manager" );
        manager = newmanager;
    }

    /// @notice set price oracle
    function setPriceOracle(address kpoaddress) external override {
        require(msg.sender==manager, "Sender not manager" );
        karteraPriceOracleAddress = kpoaddress;
        karteraPriceOracle = IPriceOracle(kpoaddress);
    } 

    /// @notice add constituent to a basket
    function addConstituent(address conaddr) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress != conaddr , "Constituent already exists");
        constituents[conaddr].constituentAddress = conaddr;
        constituents[conaddr].totalDeposit = 0;
        constituents[conaddr].active = true;
        constituents[conaddr].id = numberOfConstituents;
        if(conaddr==ethAddress){
            constituents[conaddr].decimals = 18;            
        }else{
            ERC20 token = ERC20(conaddr);
            constituents[conaddr].decimals = token.decimals();
        }
        constituentAddress[numberOfConstituents] = conaddr;
        numberOfConstituents++;
        numberOfActiveConstituents++;
    }

    // @notice activate constituent
    function activateConstituent(address conaddr) external override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress == conaddr && !constituents[conaddr].active, "Constituent does not exists or is already active");
        constituents[conaddr].active = true;
        numberOfActiveConstituents++;
    }

    /// @notice remove constituent
    function removeConstituent(address conaddr) public override {
        require(msg.sender==manager, "Sender not manager" );
        require(constituents[conaddr].constituentAddress == conaddr && constituents[conaddr].active, "Constituent does not exist or is not active");
        constituents[conaddr].active = false;
        numberOfActiveConstituents--;
    }

    function addLiquidity(address sender, address conaddr, uint256 numberoftokens) external override returns (uint256){
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        require( constituents[conaddr].active, "Constituent is not active");
        (uint256 prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(numberoftokens, prc).div(power(10, decs));
        uint256 minttokens = tokensForDeposit(amount);
        lpStartBlock[sender] = block.number;
        constituents[conaddr].totalDeposit += numberoftokens;
        return (minttokens);
    }

    function withdrawLiquidity(address sender, address conaddr, uint256 numberoftokens) external override returns(uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        uint256 blocksAhead = block.number - lpStartBlock[sender];
        require(blocksAhead >= lpBlocksReq, 'Cannot withdraw liquidity, use emergency withdraw instead');
        uint256 tokenprice = basketTokenPriceI();
        uint256 dollaramount = SafeMath.mul(numberoftokens, tokenprice).div(basketDecimals);
        uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);
        IERC20 rToken = IERC20(conaddr);
        uint256 tokenBal = rToken.balanceOf(basketaddress);
        require(tokenBal > tokensredeemed, 'Not enough tokens available for withdrawal');
        constituents[conaddr].totalDeposit -= numberoftokens;
        return (tokensredeemed);
    }

    function emergencyWithdrawLiquidity(address sender, address conaddr, uint256 numberoftokens) external override returns(uint256, uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        uint256 tokenprice = basketTokenPriceI();
        uint256 actualTokens = SafeMath.mul(numberoftokens, fee).div(10000);
        uint256 dollaramount = SafeMath.mul(actualTokens, tokenprice).div(basketDecimals);
        uint256 tokensredeemed = depositsForDollar(conaddr, dollaramount);
        IERC20 rToken = IERC20(conaddr);
        uint256 tokenBal = rToken.balanceOf(basketaddress);
        require(tokenBal > tokensredeemed, 'Not enough tokens available for withdrawal');
        constituents[conaddr].totalDeposit -= actualTokens;
        uint256 govShare = numberoftokens*govFee;
        return (tokensredeemed, govShare);
    }

    function constituentInfo(address conaddr) external view override returns (address, bool, uint256, uint8) {
        require(constituents[conaddr].constituentAddress == conaddr, "Constituent does not exist");
        return (constituents[conaddr].constituentAddress,
                constituents[conaddr].active,
                constituents[conaddr].totalDeposit,
                constituents[conaddr].decimals);
    }

    function constituentPrice(address conaddr) public view override returns (uint256, uint8) {
        require(karteraPriceOracleAddress!=address(0), 'Price Oracle not set');
        (uint256 prc, uint8 decimals) = karteraPriceOracle.price(conaddr);
        return (prc, decimals);
    }

    /// @notice get total deposit in $
    function totalDeposit() public view override returns(uint256) {
        uint256 totaldeposit = 0;
        for(uint8 i = 0; i < numberOfConstituents; i++) {
            address addr = constituentAddress[i];
            (uint prc, uint8 decs) = constituentPrice(addr);
            uint256 x = SafeMath.mul(prc, constituents[addr].totalDeposit).div(power(10, decs));            
            totaldeposit += x;
        }
        return totaldeposit;
    }

    /// @notice get price of one token of the basket
    function basketTokenPriceI() public view returns (uint256) {
        uint256 totaldeposit = totalDeposit();
        IERC20 basket = IERC20(basketaddress);
        if (totaldeposit > 0) {
            uint256 x = SafeMath.mul(totaldeposit, basketDecimals).div(basket.totalSupply());
            return x;
        }
        return SafeMath.mul(initialBasketValue, basketDecimals);
    }

    function basketTokenPrice() external view override returns (uint256) {
        return basketTokenPriceI();
    }

    /// @notice gets exchangerate for a constituent token 1token = ? basket tokens
    function exchangeRate(address conaddr) external view override returns (uint256) {
        require(constituents[conaddr].constituentAddress == conaddr, 'Constituent does not exist');
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 amount = SafeMath.mul(prc, basketDecimals).div(power(10, decs));
        uint256 tokens = tokensForDeposit(amount);
        return tokens;
    }

    /// @notice # of basket tokens for deposit $ amount 
    function tokensForDeposit(uint amount) public view returns (uint256) {
        uint256 x = SafeMath.mul(amount, basketDecimals).div(basketTokenPriceI());
        return x;
    }

    /// @notice number of constituent tokens for 1 basket token
    function depositsForTokens(address conaddr, uint numberoftokens) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 x = SafeMath.mul(numberoftokens, basketTokenPriceI()).mul(power(10, decs)).div(prc);
        return x;
    }

    /// @notice number of inactive constituent tokens for dollar amount 
    function depositsForDollar(address conaddr, uint256 dollaramount) public view returns (uint256) {
        (uint prc, uint8 decs) = constituentPrice(conaddr);
        uint256 x = SafeMath.mul(dollaramount, power(10, decs)).div(prc);
        return x;
    }

    function swap(address tokenA, address tokenB, uint256 amount) external view override returns (uint256, uint256) {
        (uint256 prcA, uint8 decA) = karteraPriceOracle.price(tokenA);
        (uint256 prcB, uint8 decB) = karteraPriceOracle.price(tokenB);
        uint256 d = 100;
        uint256 swapFee = SafeMath.mul(amount, fee).div(10000);

        uint256 tokensReceived = (amount - swapFee) * prcA * power(10, decB-decA) / prcB;

        uint256 tokensToGov = SafeMath.mul(amount, govFee).div(10000);
        tokensToGov = SafeMath.mul(tokensToGov, prcA).div(power(10, decA));
        uint256 govShare = tokensForDeposit(tokensToGov);

        IERC20 token = IERC20(tokenB);
        uint256 bal = token.balanceOf(basketaddress);
        uint256 lim = SafeMath.mul(bal, swapLimit).div(100);
        require(lim >= tokensReceived, 'Swap exceeds limit');        

        return (tokensReceived, govShare);
    }

    function copyState(address oldcontainer) public {
        require(msg.sender==manager, "Sender not manager" );
        ISwapLib basketInterface = ISwapLib(oldcontainer);
        uint16 n = basketInterface.numberOfConstituents();
        for(uint16 i=0; i<n; i++){
            address conaddr = basketInterface.constituentAddress(i);
            constituentAddress[i] = conaddr;
            (address conaddr_, bool active, uint256 td, uint8 decimals) = basketInterface.constituentInfo(conaddr);
            constituents[conaddr].constituentAddress = conaddr_;
            constituents[conaddr].id = i;
            constituents[conaddr].active = active;
            constituents[conaddr].totalDeposit = td;
            constituents[conaddr].decimals = decimals;
        }

    }

    function power(uint256 a, uint8 b) internal pure returns(uint256) {
        return a ** b;
    }
}