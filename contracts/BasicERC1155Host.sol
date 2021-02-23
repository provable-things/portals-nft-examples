//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./lib/Utils.sol";


contract BasicERC1155Host is ERC1155Upgradeable, IERC777RecipientUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC1820Registry private _erc1820;
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    address public erc777;
    address public pNetwork;

    function tokensReceived(
        address, /*_operator*/
        address _from,
        address, /*_to,*/
        uint256, /*_amount*/
        bytes calldata _userData,
        bytes calldata /*_operatorData*/
    ) external override {
        require(_from == pNetwork, "BasicERC1155Host: Invalid sender");
        require(msg.sender == erc777, "BasicERC1155Host: Invalid token");
        (uint256 _id, uint256 _amount, string memory _to) = abi.decode(_userData, (uint256, uint256, string));
        _mint(Utils.parseAddr(_to), _id, _amount, ""); // TODO: handle "" data
    }

    function initialize(
        address _erc777,
        string calldata _uri,
        address _pNetwork
    ) public {
        erc777 = _erc777;
        pNetwork = _pNetwork;
        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        __Ownable_init();
        __ERC1155_init(_uri);
    }
}
