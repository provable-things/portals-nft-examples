const BigNumber = require('bignumber.js')

const BN = (_amount, _decimals) =>
  BigNumber(_amount)
    .multipliedBy(10 ** _decimals)
    .toFixed()

const BNhex = (_amount, _decimals) =>
  `0x${BigNumber(_amount, 16)
    .multipliedBy(10 ** _decimals)
    .toFixed()}`

module.exports = {
  BN,
  BNhex,
}
