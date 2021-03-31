const { ethers, upgrades } = require('hardhat')

const main = async () => {
  const BasicERC1155Native = await ethers.getContractFactory('BasicERC1155Native')
  console.info('Deploying BasicERC1155Native...')
  const { address } = await upgrades.deployProxy(
    BasicERC1155Native,
    ['_erc1155', '_erc777', '_vault', '_basicERC1155Host'],
    { initializer: 'initialize' }
  )
  console.info('BasicERC1155Native deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
