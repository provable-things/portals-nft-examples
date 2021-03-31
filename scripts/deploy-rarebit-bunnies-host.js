const { ethers, upgrades } = require('hardhat')

const main = async () => {
  const RarebitBunniesHost = await ethers.getContractFactory('RarebitBunniesHost')
  console.info('Deploying RarebitBunniesHost...')
  const { address } = await upgrades.deployProxy(RarebitBunniesHost, ['0xdaacb0ab6fb34d24e8a67bfa14bf4d95d4c7af92', 'ipfs:/'], { initializer: 'initialize' })
  console.info('RarebitBunniesHost deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
