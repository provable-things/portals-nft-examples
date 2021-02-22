const { expect } = require('chai')
const BigNumber = require('bignumber.js')

let testNftV1Native, gameItems, owner, account1, token, vault

describe('TestNftV1Native (proxy)', () => {
  beforeEach(async () => {
    const TestNftV1Native = await ethers.getContractFactory('TestNftV1Native')
    const GameItems = await ethers.getContractFactory('GameItems')
    const Standard777Token = await ethers.getContractFactory('Standard777Token')
    const MockVault = await ethers.getContractFactory('MockVault')

    const accounts = await ethers.getSigners()
    owner = accounts[0]
    account1 = accounts[0]

    vault = await MockVault.deploy()
    token = await Standard777Token.deploy('Token', 'TKN')
    gameItems = await GameItems.deploy()
    testNftV1Native = await upgrades.deployProxy(TestNftV1Native, [gameItems.address, vault.address, token.address], {
      initializer: 'initialize',
    })
  })

  it('retrieve returns a value previously initialized', async () => {
    await gameItems.setApprovalForAll(testNftV1Native.address, true)
  })
})
