require('@nomiclabs/hardhat-ethers')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-etherscan')
require('@nomiclabs/hardhat-waffle')

module.exports = {
  solidity: {
    version: '0.7.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 200000,
  },
}
