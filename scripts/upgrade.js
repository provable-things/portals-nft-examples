const { ethers, upgrades } = require('hardhat')

const upgrade = async () => {
  const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
  await upgrades.upgradeProxy(BOX_ADDRESS, TestNftV1Native)
  console.log('Box upgraded')
}

upgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
