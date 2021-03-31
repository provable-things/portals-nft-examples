const { ethers, upgrades } = require('hardhat')

const main = async () => {
  const RarebitBunniesNative = await ethers.getContractFactory('RarebitBunniesNative')
  console.info('Deploying RarebitBunniesNative...')
  const { address } = await upgrades.deployProxy(
    RarebitBunniesNative,
    ['0x61bd6B10C7bf3e548F8659d016079e099510a4Dc', '0x89Ab32156e46F46D02ade3FEcbe5Fc4243B9AAeD', '0xd608367b33c52293201af7fb578916a7c0784bd7'],
    { initializer: 'initialize' }
  )
  console.info('RarebitBunniesNative deployed to:', address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
