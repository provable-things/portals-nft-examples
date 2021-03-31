const { use, expect } = require('chai')
const { BN, encode } = require('./utils')
const { ethers, upgrades } = require('hardhat')
const { solidity } = require('ethereum-waffle')
const singletons = require('./utils/singletons')
use(solidity)

let rarebitBunniesNative,
  rarebitBunniesHost,
  gameItems,
  owner,
  account1,
  account2,
  pnetwork,
  nativeToken,
  vault,
  hostToken

const PROVABLE_CHAIN_IDS = {
  ethereumMainnet: '0x005fe7f9',
  ethereumRinkeby: '0x0069c322',
  ethereumRopsten: '0x00f34368',
  bitcoinMainnet: '0x01ec97de',
  bitcoinTestnet: '0x018afeb2',
  telosMainnet: '0x028c7109',
  eosMainnet: '0x02e7261c',
  bscMainnet: '0x00e4b170',
}

describe('RarebitBunnies (RarebitBunniesNative and RarebitBunniesHost)', () => {
  beforeEach(async () => {
    const RarebitBunniesNative = await ethers.getContractFactory('RarebitBunniesNative')
    const RarebitBunniesHost = await ethers.getContractFactory('RarebitBunniesHost')
    const GameItems = await ethers.getContractFactory('GameItems')
    const Standard777Token = await ethers.getContractFactory('Standard777Token')
    const MockPToken = await ethers.getContractFactory('MockPToken')
    const MockVault = await ethers.getContractFactory('MockVault')

    const accounts = await ethers.getSigners()
    owner = accounts[0]
    account1 = accounts[1]
    pnetwork = accounts[2]

    // NOTE: host blockchain (evm compatible) accounts
    account2 = accounts[3]

    await singletons.ERC1820Registry(owner)

    vault = await MockVault.deploy(pnetwork.address)
    nativeToken = await Standard777Token.deploy('Native Token', 'NTKN')
    hostToken = await MockPToken.deploy('Host Token (pToken)', 'HTKN', [], pnetwork.address)
    gameItems = await GameItems.deploy()

    rarebitBunniesHost = await upgrades.deployProxy(
      RarebitBunniesHost,
      [hostToken.address, 'https://abcoathup.github.io/SampleERC1155/api/token/{id}.json'],
      {
        initializer: 'initialize',
      }
    )

    // NOTE: rarebitBunniesHost.address can be whatever you want for example also an eos contract name.
    // This test supposes that both the native and the host are blockchain evm compatible
    rarebitBunniesNative = await upgrades.deployProxy(
      RarebitBunniesNative,
      [gameItems.address, nativeToken.address, vault.address],
      {
        initializer: 'initialize',
      }
    )

    await rarebitBunniesNative.setMinTokenAmountToPegIn(BN(1, 18))
    await nativeToken.send(pnetwork.address, BN(1000, 10), '0x')
  })

  it('should be able to set minimum amount to pegin', async () => {
    await expect(rarebitBunniesNative.setMinTokenAmountToPegIn(BN(0.05, 18)))
      .to.emit(rarebitBunniesNative, 'MinTokenAmountToPegInChanged')
      .withArgs(BN(0.05, 18))
  })

  it('should not be able to set minimum amount to pegin', async () => {
    const rarebitBunniesNativeAccount1 = rarebitBunniesNative.connect(account1)
    await expect(rarebitBunniesNativeAccount1.setMinTokenAmountToPegIn(BN(0.05, 18))).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should be able to set rarebitBunniesHost', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    await expect(rarebitBunniesNative.setRarebitBunniesHost(uriedNftHostAddress))
      .to.emit(rarebitBunniesNative, 'RarebitBunniesHostChanged')
      .withArgs(uriedNftHostAddress)
  })

  it('should not be able to set rarebitBunniesHost', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    const rarebitBunniesNativeAccount1 = rarebitBunniesNative.connect(account1)
    await expect(rarebitBunniesNativeAccount1.setMinTokenAmountToPegIn(uriedNftHostAddress)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should be able to set erc777', async () => {
    const erc777 = '0x0000000000000000000000000000000000004321'
    await expect(rarebitBunniesNative.setERC777(erc777)).to.emit(rarebitBunniesNative, 'ERC777Changed').withArgs(erc777)
  })

  it('should be able to set vault', async () => {
    const newVault = '0x0000000000000000000000000000000000004444'
    await expect(rarebitBunniesNative.setVault(newVault))
      .to.emit(rarebitBunniesNative, 'VaultChanged')
      .withArgs(newVault)
  })

  it('should not be able to set erc777', async () => {
    const erc777 = '0x0000000000000000000000000000000000004321'
    const rarebitBunniesNativeAccount1 = rarebitBunniesNative.connect(account1)
    await expect(rarebitBunniesNativeAccount1.setERC777(erc777)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should not be able to set vault', async () => {
    const newVault = '0x0000000000000000000000000000000000004444'
    const rarebitBunniesNativeAccount1 = rarebitBunniesNative.connect(account1)
    await expect(rarebitBunniesNativeAccount1.setVault(newVault)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should be able to set pToken', async () => {
    const pToken = '0x0000000000000000000000000000000000004321'
    await expect(rarebitBunniesHost.setPtoken(pToken)).to.emit(rarebitBunniesHost, 'PtokenChanged').withArgs(pToken)
  })

  it('should not be able to set pToken', async () => {
    const pToken = '0x0000000000000000000000000000000000004321'
    const rarebitBunniesHostAccount1 = rarebitBunniesHost.connect(account1)
    await expect(rarebitBunniesHostAccount1.setPtoken(pToken)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should be able to retrieve minAmountToPegIn and rarebitBunniesHost after a contract upgrade', async () => {
    await rarebitBunniesNative.setMinTokenAmountToPegIn(BN(0.05, 18))
    await rarebitBunniesNative.setRarebitBunniesHost(rarebitBunniesHost.address)
    await rarebitBunniesHost.setRarebitBunniesNative(rarebitBunniesNative.address)
    const RarebitBunniesNative = await ethers.getContractFactory('RarebitBunniesNative')
    const testNftV1NativeUpgraded = await upgrades.upgradeProxy(rarebitBunniesNative.address, RarebitBunniesNative)
    const minTokenAmountToPegIn = await testNftV1NativeUpgraded.minTokenAmountToPegIn()
    const uriedNftHostAddress = await testNftV1NativeUpgraded.rarebitBunniesHost()
    expect(minTokenAmountToPegIn).to.be.equal(BN(0.05, 18))
    expect(uriedNftHostAddress).to.be.equal(rarebitBunniesHost.address)
  })

  it('should not be able to mint tokens on the host chain with a wrong token', async () => {
    const MockPToken = await ethers.getContractFactory('MockPToken')
    const data = encode(['uint256', 'uint256', 'string'], [0, 10, account2.address])
    const wrongPtoken = await MockPToken.deploy('Host Token (pToken)', 'HTKN', [], pnetwork.address)
    const wrongPtokenPnetwork = wrongPtoken.connect(pnetwork)
    await expect(wrongPtokenPnetwork.mint(rarebitBunniesHost.address, BN(1, 10), data, '0x')).to.not.emit(
      rarebitBunniesHost,
      'TransferSingle'
    )
  })

  it('should be able to pegin and pegout', async () => {
    const peginData = encode(
      ['uint256', 'uint256', 'address', 'string'],
      [0, 10, account2.address, 'https://abcoathup.github.io/SampleERC1155/api/token/{id}.json']
    )
    const pegoutData = encode(['uint256', 'uint256', 'address'], [0, 10, owner.address])
    const initialBalance = await gameItems.balanceOf(owner.address, 0)

    await rarebitBunniesNative.setRarebitBunniesHost(rarebitBunniesHost.address)
    await rarebitBunniesHost.setRarebitBunniesNative(rarebitBunniesNative.address)

    // P E G   I N
    await nativeToken.approve(rarebitBunniesNative.address, BN(1, 18))
    await gameItems.setApprovalForAll(rarebitBunniesNative.address, true)
    await expect(rarebitBunniesNative.mint(0, 10, account2.address))
      .to.emit(rarebitBunniesNative, 'Minted')
      .withArgs(0, 10, account2.address)

    // NOTE: at this point let's suppose that a pNetwork node processes the pegin...

    const hostTokenPnetwork = hostToken.connect(pnetwork)
    const enclavePeginMetadata = encode(
      ['bytes1', 'bytes', 'bytes4', 'address'],
      ['0x01', peginData, PROVABLE_CHAIN_IDS.bscMainnet, rarebitBunniesNative.address]
    )
    await expect(hostTokenPnetwork.mint(rarebitBunniesHost.address, BN(1, 10), enclavePeginMetadata, '0x'))
      .to.emit(rarebitBunniesHost, 'TransferSingle')
      .withArgs(hostToken.address, '0x0000000000000000000000000000000000000000', account2.address, 0, 10)
    expect(await rarebitBunniesHost.balanceOf(account2.address, 0)).to.be.equal(10)

    // P E G   O U T
    const basicERC1155HostAccount2 = rarebitBunniesHost.connect(account2)
    await expect(basicERC1155HostAccount2.burn(0, 10, owner.address))
      .to.emit(basicERC1155HostAccount2, 'Burned')
      .withArgs(0, 10, owner.address)
    expect(await rarebitBunniesHost.balanceOf(account2.address, 0)).to.be.equal(0)

    const vaultPnetwork = vault.connect(pnetwork)
    const enclavePegoutMetadata = encode(
      ['bytes1', 'bytes', 'bytes4', 'address'],
      ['0x01', pegoutData, PROVABLE_CHAIN_IDS.bscMainnet, rarebitBunniesHost.address]
    )
    await vaultPnetwork.pegOut(rarebitBunniesNative.address, nativeToken.address, 0, enclavePegoutMetadata)
    expect(await gameItems.balanceOf(owner.address, 0)).to.be.equal(initialBalance)
  })

  it('should be able to pegin more than an user owns', async () => {
    await nativeToken.approve(rarebitBunniesNative.address, BN(1, 18))
    await gameItems.setApprovalForAll(rarebitBunniesNative.address, true)
    await expect(rarebitBunniesNative.mint(0, BN(11, 18), account2.address)).to.be.revertedWith(
      'ERC1155: insufficient balance for transfer'
    )
  })

  it('only pnetwork is able to mint tokens on the host blockchain', async () => {
    await hostToken.connect(pnetwork).mint(owner.address, 1000, '0x', '0x')
    await expect(hostToken.send(rarebitBunniesHost.address, 1000, '0x')).to.not.emit(
      rarebitBunniesHost,
      'TransferSingle'
    )
  })
})
