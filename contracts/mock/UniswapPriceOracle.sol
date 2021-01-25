// SPDX-License-Identifier: MIT

pragma solidity  >=0.4.22 <0.8.0;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

import '@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol';
import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
// import '../libraries/UniswapV2OracleLibrary.sol';

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract UniswapPriceOracle {
    using FixedPoint for *;

    uint public constant PERIOD = 1 minutes;

    IUniswapV2Pair public pair;
    address public token0;
    address public token1;

    uint    public price0CumulativeLast;
    uint    public price1CumulativeLast;
    uint32  public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    constructor() public {
        address rinkFactory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        address rinkWETH = 0xDf032Bc4B9dC2782Bb09352007D4C57B75160B15;
        address rinkWBTC = 0x7430e8f6fC7B569A00400c3F1AB93AF981BA4fF9;
        // address factory_addresss = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        // address Weth_address = 0xF3A6679B266899042276804930B3bFBaf807F15b;
        // address Wbtc_address = 0x3BDb41FcA3956A72cd841696bD59ca860F3f0513;
        // IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(rinkFactory, rinkWETH, rinkWBTC));

        IUniswapV2Factory fac = IUniswapV2Factory(rinkFactory);

        pair = IUniswapV2Pair(fac.allPairs(1));

        // pair = _pair;
        token0 = pair.token0();
        token1 = pair.token1();
        price0CumulativeLast = pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)        
        price1CumulativeLast = pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, 'UniswapPriceOracle: NO_RESERVES'); // ensure that there's liquidity in the pair
    }

    function cumulativePrice(int x) public view returns (uint) {
        if(x==0){
            return price0CumulativeLast;
        }
        return price1CumulativeLast;
    }

    function getToken0() external view returns (address) {
        return token0;
    }

    function getToken1() external view returns (address) {
        return token1;
    }

    function update() external {
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        require(timeElapsed >= PERIOD, 'UniswapPriceOracle: PERIOD_NOT_ELAPSED');
        
        // return timeElapsed;

        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
        price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
        price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint amountIn) external view returns (uint amountOut) {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, 'UniswapPriceOracle: INVALID_TOKEN');
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }
}