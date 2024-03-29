const { use, expect } = require('chai')
const { BN, encode } = require('./utils')
const { ethers, upgrades } = require('hardhat')
const { solidity } = require('ethereum-waffle')
const singletons = require('./utils/singletons')
use(solidity)

let basicERC1155Native, basicERC1155Host, gameItems, owner, account1, account2, pnetwork, nativeToken, vault, hostToken

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

describe('BasicERC1155 (BasicERC1155Native and BasicERC1155Host)', () => {
  beforeEach(async () => {
    const BasicERC1155Native = await ethers.getContractFactory('BasicERC1155Native')
    const BasicERC1155Host = await ethers.getContractFactory('BasicERC1155Host')
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

    basicERC1155Host = await upgrades.deployProxy(
      BasicERC1155Host,
      [hostToken.address, 'https://abcoathup.github.io/SampleERC1155/api/token/{id}.json'],
      {
        initializer: 'initialize',
      }
    )

    // NOTE: basicERC1155Host.address can be whatever you want for example also an eos contract name.
    // This test supposes that both the native and the host are blockchain evm compatible
    basicERC1155Native = await upgrades.deployProxy(
      BasicERC1155Native,
      [gameItems.address, nativeToken.address, vault.address],
      {
        initializer: 'initialize',
      }
    )

    await basicERC1155Native.setMinTokenAmountToPegIn(BN(1, 18))
    await nativeToken.send(pnetwork.address, BN(1000, 10), '0x')
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
    await expect(basicERC1155Native.setBasicERC1155Host(uriedNftHostAddress))
      .to.emit(basicERC1155Native, 'BasicERC1155HostChanged')
      .withArgs(uriedNftHostAddress)
  })

  it('should not be able to set basicERC1155Host', async () => {
    const uriedNftHostAddress = '0x0000000000000000000000000000000000000001'
    const basicERC1155NativeAccount1 = basicERC1155Native.connect(account1)
    await expect(basicERC1155NativeAccount1.setMinTokenAmountToPegIn(uriedNftHostAddress)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
  })

  it('should be able to set erc777', async () => {
    const erc777 = '0x0000000000000000000000000000000000004321'
    await expect(basicERC1155Native.setERC777(erc777)).to.emit(basicERC1155Native, 'ERC777Changed').withArgs(erc777)
  })

  it('should be able to set vault', async () => {
    const newVault = '0x0000000000000000000000000000000000004444'
    await expect(basicERC1155Native.setVault(newVault)).to.emit(basicERC1155Native, 'VaultChanged').withArgs(newVault)
  })

  it('should not be able to set erc777', async () => {
    const erc777 = '0x0000000000000000000000000000000000004321'
    const basicERC1155NativeAccount1 = basicERC1155Native.connect(account1)
    await expect(basicERC1155NativeAccount1.setERC777(erc777)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should not be able to set vault', async () => {
    const newVault = '0x0000000000000000000000000000000000004444'
    const basicERC1155NativeAccount1 = basicERC1155Native.connect(account1)
    await expect(basicERC1155NativeAccount1.setVault(newVault)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should be able to set pToken', async () => {
    const pToken = '0x0000000000000000000000000000000000004321'
    await expect(basicERC1155Host.setPtoken(pToken)).to.emit(basicERC1155Host, 'PtokenChanged').withArgs(pToken)
  })

  it('should not be able to set pToken', async () => {
    const pToken = '0x0000000000000000000000000000000000004321'
    const basicERC1155HostAccount1 = basicERC1155Host.connect(account1)
    await expect(basicERC1155HostAccount1.setPtoken(pToken)).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('should be able to retrieve minAmountToPegIn and basicERC1155Host after a contract upgrade', async () => {
    await basicERC1155Native.setMinTokenAmountToPegIn(BN(0.05, 18))
    await basicERC1155Native.setBasicERC1155Host(basicERC1155Host.address)
    await basicERC1155Host.setBasicERC1155Native(basicERC1155Native.address)
    const BasicERC1155Native = await ethers.getContractFactory('BasicERC1155Native')
    const testNftV1NativeUpgraded = await upgrades.upgradeProxy(basicERC1155Native.address, BasicERC1155Native)
    const minTokenAmountToPegIn = await testNftV1NativeUpgraded.minTokenAmountToPegIn()
    const uriedNftHostAddress = await testNftV1NativeUpgraded.basicERC1155Host()
    expect(minTokenAmountToPegIn).to.be.equal(BN(0.05, 18))
    expect(uriedNftHostAddress).to.be.equal(basicERC1155Host.address)
  })

  it('should not be able to pegin because of minimum nativeToken amount not reached', async () => {
    await nativeToken.approve(basicERC1155Native.address, BN(0.5, 18))
    await expect(basicERC1155Native.mint(0, 10, BN(0.5, 18), account2.address)).to.be.revertedWith(
      'BasicERC1155Native: tokenAmount is less than minTokenAmountToPegIn'
    )
  })

  it('should not be able to mint tokens on the host chain with a wrong token', async () => {
    const MockPToken = await ethers.getContractFactory('MockPToken')
    const data = encode(['uint256', 'uint256', 'string'], [0, 10, account2.address])
    const wrongPtoken = await MockPToken.deploy('Host Token (pToken)', 'HTKN', [], pnetwork.address)
    const wrongPtokenPnetwork = wrongPtoken.connect(pnetwork)
    await expect(wrongPtokenPnetwork.mint(basicERC1155Host.address, BN(1, 10), data, '0x')).to.not.emit(
      basicERC1155Host,
      'TransferSingle'
    )
  })

  it('should be able to pegin and pegout', async () => {
    const peginData = encode(['uint256', 'uint256', 'address'], [0, 10, account2.address])
    const pegoutData = encode(['uint256', 'uint256', 'address'], [0, 10, owner.address])
    const initialBalance = await gameItems.balanceOf(owner.address, 0)

    await basicERC1155Native.setBasicERC1155Host(basicERC1155Host.address)
    await basicERC1155Host.setBasicERC1155Native(basicERC1155Native.address)

    // P E G   I N
    await nativeToken.approve(basicERC1155Native.address, BN(1, 18))
    await gameItems.setApprovalForAll(basicERC1155Native.address, true)
    await expect(basicERC1155Native.mint(0, 10, BN(1, 18), account2.address))
      .to.emit(basicERC1155Native, 'Minted')
      .withArgs(0, 10, account2.address)

    // NOTE: at this point let's suppose that a pNetwork node processes the pegin...

    const hostTokenPnetwork = hostToken.connect(pnetwork)
    const enclavePeginMetadata = encode(
      ['bytes1', 'bytes', 'bytes4', 'address'],
      ['0x01', peginData, PROVABLE_CHAIN_IDS.bscMainnet, basicERC1155Native.address]
    )
    await expect(hostTokenPnetwork.mint(basicERC1155Host.address, BN(1, 10), enclavePeginMetadata, '0x'))
      .to.emit(basicERC1155Host, 'TransferSingle')
      .withArgs(hostToken.address, '0x0000000000000000000000000000000000000000', account2.address, 0, 10)

    expect(await basicERC1155Host.balanceOf(account2.address, 0)).to.be.equal(10)

    // P E G   O U T
    const basicERC1155HostAccount2 = basicERC1155Host.connect(account2)
    await expect(basicERC1155HostAccount2.burn(0, 10, owner.address))
      .to.emit(basicERC1155HostAccount2, 'Burned')
      .withArgs(0, 10, owner.address)
    expect(await basicERC1155Host.balanceOf(account2.address, 0)).to.be.equal(0)

    const vaultPnetwork = vault.connect(pnetwork)
    const enclavePegoutMetadata = encode(
      ['bytes1', 'bytes', 'bytes4', 'address'],
      ['0x01', pegoutData, PROVABLE_CHAIN_IDS.bscMainnet, basicERC1155Host.address]
    )
    await vaultPnetwork.pegOut(basicERC1155Native.address, nativeToken.address, 0, enclavePegoutMetadata)
    expect(await gameItems.balanceOf(owner.address, 0)).to.be.equal(initialBalance)
  })

  it('should be able to pegin more than an user owns', async () => {
    await nativeToken.approve(basicERC1155Native.address, BN(1, 18))
    await gameItems.setApprovalForAll(basicERC1155Native.address, true)
    await expect(basicERC1155Native.mint(0, BN(11, 18), BN(1, 18), account2.address)).to.be.revertedWith(
      'ERC1155: insufficient balance for transfer'
    )
  })

  it('only pnetwork is able to mint tokens on the host blockchain', async () => {
    await hostToken.connect(pnetwork).mint(owner.address, 1000, '0x', '0x')
    await expect(hostToken.send(basicERC1155Host.address, 1000, '0x')).to.not.emit(basicERC1155Host, 'TransferSingle')
  })
})
