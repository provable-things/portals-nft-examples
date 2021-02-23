//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./lib/Utils.sol";
import "./interfaces/IPToken.sol";


contract BasicERC1155Host is ERC1155Upgradeable, IERC777RecipientUpgradeable, OwnableUpgradeable {
    IERC1820Registry private _erc1820;
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    address public pToken;
    string public basicERC1155Native;

    event Burned(uint256 id, uint256 amount, string to);
    event BasicERC1155NativeChanged(string basicERC1155Native);

    function setBasicERC1155Native(string calldata _basicERC1155Native) external onlyOwner returns (bool) {
        basicERC1155Native = _basicERC1155Native;
        emit BasicERC1155NativeChanged(basicERC1155Native);
        return true;
    }

    /**
     *  @notice only pNetwork is able to mint pTokens so nobody else is able
     *          to call _mint because of _from == address(0) and the whitelisting
     *          of pToken
     *
     **/
    function tokensReceived(
        address, /*_operator*/
        address _from,
        address, /*_to,*/
        uint256, /*_amount*/
        bytes calldata _userData,
        bytes calldata /*_operatorData*/
    ) external override {
        require(_from == address(0), "BasicERC1155Host: Invalid sender");
        require(msg.sender == pToken, "BasicERC1155Host: Invalid token");
        (uint256 _id, uint256 _amount, string memory _to) = abi.decode(_userData, (uint256, uint256, string));
        _mint(Utils.parseAddr(_to), _id, _amount, ""); // TODO: handle "" data
    }

    function initialize(
        address _pToken,
        string memory _uri
    ) public {
        pToken = _pToken;
        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        __Ownable_init();
        __ERC1155_init(_uri);
    }

    function burn(
        uint256 _id,
        uint256 _amount,
        string memory _to
    ) public returns (bool) {
        // TODO: understand if we should burn a minimum amont of pToken token
        _burn(msg.sender, _id, _amount);
        bytes memory data = abi.encode(_id, _amount, _to);
        IPToken(pToken).redeem(0, data, basicERC1155Native);
        emit Burned(_id, _amount, _to);
        return true;
    }
}
