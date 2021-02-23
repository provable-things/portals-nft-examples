const { use, expect } = require('chai')
const { solidity } = require('ethereum-waffle')
const { BN, encode } = require('./utils')
const singletons = require('./utils/singletons')
use(solidity)

let uriedNftV1Native, gameItems, owner, account1, account2, token, vault

describe('UriedNftNativeV1 (proxy)', () => {
  beforeEach(async () => {
    const UriedNftNativeV1 = await ethers.getContractFactory('UriedNftNativeV1')
    const GameItems = await ethers.getContractFactory('GameItems')
    const Standard777Token = await ethers.getContractFactory('Standard777Token')
    const MockVault = await ethers.getContractFactory('MockVault')

    const accounts = await ethers.getSigners()
    owner = accounts[0]
    account1 = accounts[1]

    // NOTE: host blockchain (evm compatible) accounts
    account2 = accounts[2]

    await singletons.ERC1820Registry(owner)

    vault = await MockVault.deploy()
    token = await Standard777Token.deploy('Token', 'TKN')
    gameItems = await GameItems.deploy()
    uriedNftV1Native = await upgrades.deployProxy(
      UriedNftNativeV1,
      [gameItems.address, vault.address, token.address, '0x0000000000000000000000000000000000000000'],
      {
        initializer: 'initialize',
      }
    )

    await uriedNftV1Native.setMinTokenAmountToPegIn(BN(1, 18))
  })

  it('should be able to set minimum amount to pegin', async () => {
    await expect(uriedNftV1Native.setMinTokenAmountToPegIn(BN(0.05, 18)))
      .to.emit(uriedNftV1Native, 'MinTokenAmountToPegInChanged')
      .withArgs(BN(0.05, 18))
  })

  it('should not be able to set minimum amount to pegin', async () => {
    const testNftV1NativeAccount1 = uriedNftV1Native.connect(account1)
    await expect(testNftV1NativeAccount1.setMinTokenAmountToPegIn(BN(0.05, 18))).to.be.revertedWith(
      'UriedNftNativeV1: caller is not the owner'
    )
  })

  it('should be able to set uriedNftHost', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    await expect(uriedNftV1Native.setUriedNftHost(uriedNftHostAddress))
      .to.emit(uriedNftV1Native, 'UriedNftHostChanged')
      .withArgs(uriedNftHostAddress)
  })

  it('should not be able to set uriedNftHost', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    const testNftV1NativeAccount1 = uriedNftV1Native.connect(account1)
    await expect(testNftV1NativeAccount1.setMinTokenAmountToPegIn(uriedNftHostAddress)).to.be.revertedWith(
      'UriedNftNativeV1: caller is not the owner'
    )
  })

  it('should be able to retrieve minAmountToPegIn and uriedNftHost after a contract upgrade', async () => {
    await uriedNftV1Native.setMinTokenAmountToPegIn(BN(0.05, 18))
    const UriedNftNativeV1 = await ethers.getContractFactory('UriedNftNativeV1')
    const testNftV1NativeUpgraded = await upgrades.upgradeProxy(uriedNftV1Native.address, UriedNftNativeV1)
    const minTokenAmountToPegIn = await testNftV1NativeUpgraded.minTokenAmountToPegIn()
    const uriedNftHostAddress = await testNftV1NativeUpgraded.uriedNftHost()
    expect(minTokenAmountToPegIn).to.be.equal(BN(0.05, 18))
    expect(uriedNftHostAddress).to.be.equal('0x0000000000000000000000000000000000000000')
  })

  it('should be able to pegin', async () => {
    const encoded = encode(['uint256', 'uint256', 'string', 'string'], [0, 10, account2.address, 'uri'])
    await token.approve(uriedNftV1Native.address, BN(1, 18))
    await gameItems.setApprovalForAll(uriedNftV1Native.address, true)
    await expect(uriedNftV1Native.pegIn(0, 10, BN(1, 18), account2.address))
      .to.emit(uriedNftV1Native, 'PegIn')
      .withArgs(0, 10, BN(1, 18), account2.address)
      .to.emit(vault, 'PegIn')
      .withArgs(
        token.address,
        uriedNftV1Native.address,
        BN(1, 18),
        '0x0000000000000000000000000000000000000000',
        encoded
      )

    // NOTE: at this point let's suppose that a pNetwork node processes the pegin...
  })
})
