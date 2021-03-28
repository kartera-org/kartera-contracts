# ########################### kartera-contracts #############################################
# ########################### Kartera Token #################################################
Kartera Token (KART) is the native token 
# 0x324048a600DE0Cb831ef359E15c671c113f9255c
# ########################### SWAP BASKET ###################################################
Swap Basket is a multi token basket. 
**Add liquidity by depositing tokens and receive basket token. 
**Any tokens in the basket can be exchanged for basket tokens. 
**To exchange tokens for basket tokens some KART tokens have to be returned to the basket.
**number of KART tokens are specified as per $ value of transaction 1KART for withdrawCostMultiplier($100). As KART value rises withdrawCostMultiplier can be increased
**Tokens deposited in the basket can also be swapped for a fee of 0.3%.
**Swap Fees are shared among basket token holders (LPs) (0.25%) and KART token holders (0.05% sent to Kart Farm). 
**Swap fee increase with % of tokens withdrawn every 1% fee goes up by 0.3%. 
**Max tokens withdrawn in one trade is capped at 10% of the tokens in the basket.
# 0xEe47E10d38e5c77aC9C65995473FCA4c30095DB7
# ########################### SWAP FARM #################################
Swap Farm: lock basket tokens in Swap Farm to mine KART tokens
# 0x52E0cF8a46D3531fDB57EfCbA2f12ccf48271753
# ########################### KART FARM ###################################################
KART Farm: lock KART tokens to share 0.05% fee from swap trades
# 0x7cDF6c8f181405cA124dA5aE6073EacA75D69215
# ########################### Governance Contract ########################################
# 0xd474b6B0e400fba10336D73fB79873F1839DfcAD
# ########################### KARTERA PRICE ORACLE ########################################
KarteraPriceOracle: There is no token market for price discovery on this protocol. All token prices are aggregated from uniswap mid market price. More oracles will added. 