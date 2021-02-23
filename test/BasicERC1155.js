const { use, expect } = require('chai')
const { solidity } = require('ethereum-waffle')
const { BN, encode } = require('./utils')
const singletons = require('./utils/singletons')
use(solidity)

let basicERC1155Native, basicERC1155Host, gameItems, owner, account1, account2, pnetwork, nativeToken, vault

describe('BasicERC1155 (BasicERC1155Native and BasicERC1155Host)', () => {
  beforeEach(async () => {
    const BasicERC1155Native = await ethers.getContractFactory('BasicERC1155Native')
    const BasicERC1155Host = await ethers.getContractFactory('BasicERC1155Host')
    const GameItems = await ethers.getContractFactory('GameItems')
    const Standard777Token = await ethers.getContractFactory('Standard777Token')
    const MockVault = await ethers.getContractFactory('MockVault')

    const accounts = await ethers.getSigners()
    owner = accounts[0]
    account1 = accounts[1]
    pnetwork = accounts[2]

    // NOTE: host blockchain (evm compatible) accounts
    account2 = accounts[3]

    await singletons.ERC1820Registry(owner)

    vault = await MockVault.deploy()
    nativeToken = await Standard777Token.deploy('Native Token', 'NTKN')
    hostToken = await Standard777Token.deploy('Host Token (pToken)', 'HTKN')
    gameItems = await GameItems.deploy()

    basicERC1155Host = await upgrades.deployProxy(
      BasicERC1155Host,
      [hostToken.address, 'https://abcoathup.github.io/SampleERC1155/api/token/{id}.json', pnetwork.address],
      {
        initializer: 'initialize',
      }
    )

    // NOTE: basicERC1155Host.address can be whatever you want for example also an eos contract name.
    // This test supposes that both the native and the host are blockchain evm compatible
    basicERC1155Native = await upgrades.deployProxy(
      BasicERC1155Native,
      [gameItems.address, vault.address, nativeToken.address, basicERC1155Host.address],
      {
        initializer: 'initialize',
      }
    )

    await basicERC1155Native.setMinTokenAmountToPegIn(BN(1, 18))
    await nativeToken.send(pnetwork.address, BN(1000, 10), '0x')
    await hostToken.send(pnetwork.address, BN(1000, 10), '0x')
  })

  it('should be able to set minimum amount to pegin', async () => {
    await expect(basicERC1155Native.setMinTokenAmountToPegIn(BN(0.05, 18)))
      .to.emit(basicERC1155Native, 'MinTokenAmountToPegInChanged')
      .withArgs(BN(0.05, 18))
  })

  it('should not be able to set minimum amount to pegin', async () => {
    const basicERC1155NativeAccount1 = basicERC1155Native.connect(account1)
    await expect(basicERC1155NativeAccount1.setMinTokenAmountToPegIn(BN(0.05, 18))).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should be able to set basicERC1155Host', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    await expect(basicERC1155Native.setBasicERC1155HostFactory(uriedNftHostAddress))
      .to.emit(basicERC1155Native, 'BasicERC1155HostFactoryChanged')
      .withArgs(uriedNftHostAddress)
  })

  it('should not be able to set basicERC1155Host', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    const basicERC1155NativeAccount1 = basicERC1155Native.connect(account1)
    await expect(basicERC1155NativeAccount1.setMinTokenAmountToPegIn(uriedNftHostAddress)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should be able to retrieve minAmountToPegIn and basicERC1155Host after a contract upgrade', async () => {
    await basicERC1155Native.setMinTokenAmountToPegIn(BN(0.05, 18))
    const BasicERC1155Native = await ethers.getContractFactory('BasicERC1155Native')
    const testNftV1NativeUpgraded = await upgrades.upgradeProxy(basicERC1155Native.address, BasicERC1155Native)
    const minTokenAmountToPegIn = await testNftV1NativeUpgraded.minTokenAmountToPegIn()
    const uriedNftHostAddress = await testNftV1NativeUpgraded.basicERC1155Host()
    expect(minTokenAmountToPegIn).to.be.equal(BN(0.05, 18))
    expect(uriedNftHostAddress).to.be.equal(basicERC1155Host.address)
  })

  it('should not be able to pegin because of minimum nativeToken amount not reached', async () => {
    await nativeToken.approve(basicERC1155Native.address, BN(0.5, 18))
    await expect(basicERC1155Native.pegIn(0, 10, BN(0.5, 18), account2.address)).to.be.revertedWith(
      'BasicERC1155Native: tokenAmount is less than minTokenAmountToPegIn'
    )
  })

  it('should not be able to mint tokens on the host chain if sender is not pNetwork', async () => {
    await expect(hostToken.send(basicERC1155Host.address, BN(1, 10), '0x')).to.be.revertedWith(
      'BasicERC1155Host: Invalid sender'
    )
  })

  it('should not be able to mint tokens on the host chain with a wrong token', async () => {
    const nativeTokenPnetwork = nativeToken.connect(pnetwork)
    await expect(nativeTokenPnetwork.send(basicERC1155Host.address, BN(1, 10), '0x')).to.be.revertedWith(
      'BasicERC1155Host: Invalid token'
    )
  })

  it('should be able to pegin', async () => {
    const data = encode(['uint256', 'uint256', 'string'], [0, 10, account2.address])
    await nativeToken.approve(basicERC1155Native.address, BN(1, 18))
    await gameItems.setApprovalForAll(basicERC1155Native.address, true)
    await expect(basicERC1155Native.pegIn(0, 10, BN(1, 18), account2.address))
      .to.emit(basicERC1155Native, 'PegIn')
      .withArgs(0, 10, BN(1, 18), account2.address)
      .to.emit(vault, 'PegIn')
      .withArgs(nativeToken.address, basicERC1155Native.address, BN(1, 18), basicERC1155Host.address, data)

    // NOTE: at this point let's suppose that a pNetwork node processes the pegin...

    const hostTokenPnetwork = hostToken.connect(pnetwork)
    // TODO: what does the fact that the operator is the hostToken imply?
    await expect(hostTokenPnetwork.send(basicERC1155Host.address, BN(1, 10), data))
      .to.emit(basicERC1155Host, 'TransferSingle')
      .withArgs(hostToken.address, '0x0000000000000000000000000000000000000000', account2.address, 0, 10)
    expect(await basicERC1155Host.balanceOf(account2.address, 0)).to.be.equal(10)
  })
})
