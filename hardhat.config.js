require('dotenv').config()
require('@nomiclabs/hardhat-ethers')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-etherscan')

const getEnvironmentVariable = (_envVar) =>
  process.env[_envVar]
    ? process.env[_envVar]
    : (console.error(
        '✘ Cannot migrate!\n',
        '✘ Please provide an infura api key as and an\n',
        '✘ account private key as environment variables:\n',
        '✘ MAINNET_PRIVATE_KEY\n',
        '✘ ROPSTEN_PRIVATE_KEY\n',
        '✘ INFURA_KEY\n',
        '✘ ETHERSCAN_API_KEY\n'
      ),
      process.exit(1))

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
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
  defaultNetwork: 'ropsten',
  networks: {
    ropsten: {
      url: `https://ropsten.infura.io/v3/${getEnvironmentVariable('INFURA_KEY')}`,
      accounts: [getEnvironmentVariable('ROPSTEN_PRIVATE_KEY')],
      gas: 6e6,
      gasPrice: 30e9,
      websockets: true,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${getEnvironmentVariable('INFURA_KEY')}`,
      accounts: [getEnvironmentVariable('MAINNET_PRIVATE_KEY')],
      gas: 3e6,
      gasPrice: 180e9,
      websockets: true,
    },
  },
  etherscan: {
    apiKey: getEnvironmentVariable('ETHERSCAN_API_KEY'),
  },
  mocha: {
    timeout: 200000,
  },
}
