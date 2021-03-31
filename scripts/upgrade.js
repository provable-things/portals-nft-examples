const { ethers, upgrades } = require('hardhat')

const upgrade = async () => {
  const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
  // FIXME Where does `BOX_ADDRESS` come from? Please import it!
  // eslint-disable-next-line no-undef
  await upgrades.upgradeProxy(BOX_ADDRESS, TestNftV1Native)
  console.info('Box upgraded')
}

upgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
