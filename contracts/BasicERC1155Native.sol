//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "./lib/Utils.sol";
import "./interfaces/IPERC20Vault.sol";


contract BasicERC1155Native is ERC1155HolderUpgradeable, IERC777RecipientUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC1820Registry private _erc1820;
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    address public erc1155;
    address public erc777;
    address public vault;
    string public basicERC1155Host;
    uint256 public minTokenAmountToPegIn;

    event Minted(uint256 id, uint256 amount, string to);
    event MinTokenAmountToPegInChanged(uint256 minTokenAmountToPegIn);
    event BasicERC1155HostChanged(string basicERC1155Host);

    function setMinTokenAmountToPegIn(uint256 _minTokenAmountToPegIn) external onlyOwner returns (bool) {
        minTokenAmountToPegIn = _minTokenAmountToPegIn;
        emit MinTokenAmountToPegInChanged(minTokenAmountToPegIn);
        return true;
    }

    function setBasicERC1155Host(string calldata _basicERC1155Host) external onlyOwner returns (bool) {
        basicERC1155Host = _basicERC1155Host;
        emit BasicERC1155HostChanged(basicERC1155Host);
        return true;
    }

    function tokensReceived(
        address, /*_operator*/
        address _from,
        address, /*_to,*/
        uint256, /*_amount*/
        bytes calldata _userData,
        bytes calldata /*_operatorData*/
    ) external override {
        require(_from == IPERC20Vault(vault).PNETWORK(), "BasicERC1155Native: Invalid sender");
        (uint256 _id, uint256 _amount, string memory _to) = abi.decode(_userData, (uint256, uint256, string));
        //IERC1155(erc1155).safeTransferFrom(msg.sender, Utils.parseAddr(_to), _id, _amount, "");
    }

    function initialize(
        address _erc1155,
        address _erc777,
        address _vault,
        string memory _basicERC1155Host
    ) public {
        erc1155 = _erc1155;
        erc777 = _erc777;
        vault = _vault;
        basicERC1155Host = _basicERC1155Host;
        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        __ERC1155Holder_init();
        __Ownable_init();
    }

    function mint(
        uint256 _id,
        uint256 _nftAmount,
        uint256 _tokenAmount,
        string memory _to
    ) public returns (bool) {
        require(_nftAmount > 0, "BasicERC1155Native: nftAmount must be greater than 0");
        require(
            _tokenAmount >= minTokenAmountToPegIn,
            "BasicERC1155Native: tokenAmount is less than minTokenAmountToPegIn"
        );
        IERC1155(erc1155).safeTransferFrom(msg.sender, address(this), _id, _nftAmount, "");
        IERC20(erc777).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        bytes memory data = abi.encode(_id, _nftAmount, _to);
        IERC20(erc777).safeApprove(vault, _tokenAmount);
        IPERC20Vault(vault).pegIn(_tokenAmount, erc777, basicERC1155Host, data);
        emit Minted(_id, _nftAmount, _to);
        return true;
    }
}
