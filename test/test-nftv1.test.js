const { use, expect } = require('chai')
const { solidity } = require('ethereum-waffle')
const { BN } = require('./utils')
const singletons = require('./utils/singletons')
use(solidity)

let testNftV1Native, gameItems, owner, account1, token, vault

describe('TestNftV1Native (proxy)', () => {
  beforeEach(async () => {
    const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
    const GameItems = await ethers.getContractFactory('GameItems')
    const Standard777Token = await ethers.getContractFactory('Standard777Token')
    const MockVault = await ethers.getContractFactory('MockVault')

    const accounts = await ethers.getSigners()
    owner = accounts[0]
    account1 = accounts[1]

    await singletons.ERC1820Registry(owner)

    vault = await MockVault.deploy()
    token = await Standard777Token.deploy('Token', 'TKN')
    gameItems = await GameItems.deploy()
    testNftV1Native = await upgrades.deployProxy(TestNftV1Native, [gameItems.address, vault.address, token.address], {
      initializer: 'initialize',
    })
  })

  it('should be able to set minimum amount to pegin', async () => {
    await expect(testNftV1Native.setMinTokenAmountToPegIn(BN(0.05, 18)))
      .to.emit(testNftV1Native, 'MinTokenAmountToPegInChanged')
      .withArgs(BN(0.05, 18))
  })

  it('should not be able to set minimum amount to pegin', async () => {
    const testNftV1NativeAccount1 = testNftV1Native.connect(account1)
    await expect(testNftV1NativeAccount1.setMinTokenAmountToPegIn(BN(0.05, 18))).to.be.revertedWith(
      'TestNftV1Native: caller is not the owner'
    )
  })

  it('should be able to retrieve minAmountToPegIn after a contract upgrade', async () => {
    await testNftV1Native.setMinTokenAmountToPegIn(BN(0.05, 18))
    const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
    const testNftV1NativeUpgraded = await upgrades.upgradeProxy(testNftV1Native.address, TestNftV1Native)
    const minTokenAmountToPegIn = await testNftV1NativeUpgraded.minTokenAmountToPegIn()
    expect(minTokenAmountToPegIn).to.be.equal(BN(0.05, 18))
  })
})
