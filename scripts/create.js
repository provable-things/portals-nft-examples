const { ethers, upgrades } = require('hardhat')

const main = async () => {
  const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
  console.info('Deploying TestNftV1Native...')
  const { address } = await upgrades.deployProxy(TestNftV1Native, [42], { initializer: 'initialize' })
  console.info('TestNftV1Native deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
