const { BNhex } = require('./index')
const { ethers } = require('hardhat')
const { ERC1820_REGISTRY_ABI, ERC1820_REGISTRY_ADDRESS, ERC1820_REGISTRY_DEPLOY_TX } = require('./erc1820-data')

const getDeployedERC1820Registry = () =>
  new ethers.Contract(ERC1820_REGISTRY_ADDRESS, ERC1820_REGISTRY_ABI, ethers.getDefaultProvider())

module.exports.ERC1820Registry = async (_wallet) => {
  if ((await ethers.provider.getCode(ERC1820_REGISTRY_ADDRESS)).length > '0x0'.length)
    return getDeployedERC1820Registry()

  await _wallet.sendTransaction({
    from: _wallet.address,
    to: '0xa990077c3205cbDf861e17Fa532eeB069cE9fF96',
    value: BNhex(0.08, 18),
    gasPrice: 0,
  })

  await ethers.provider.sendTransaction(ERC1820_REGISTRY_DEPLOY_TX)
  return getDeployedERC1820Registry()
}
