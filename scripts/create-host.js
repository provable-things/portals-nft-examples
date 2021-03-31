const { ethers, upgrades } = require('hardhat')

const main = async () => {
  const BasicERC1155Host = await ethers.getContractFactory('BasicERC1155Host')
  console.info('Deploying BasicERC1155Host...')
  const { address } = await upgrades.deployProxy(BasicERC1155Host, ['_pToken', '_uri'], { initializer: 'initialize' })
  console.info('BasicERC1155Host deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
