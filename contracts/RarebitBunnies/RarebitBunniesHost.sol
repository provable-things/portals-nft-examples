//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "../interfaces/IPToken.sol";
import "../lib/Utils.sol";


contract RarebitBunniesHost is ERC1155Upgradeable, IERC777RecipientUpgradeable, OwnableUpgradeable {
    IERC1820Registry private _erc1820;
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    address public pToken;
    address rarebitBunniesNative;
    mapping(uint256 => string) _uris;

    event Burned(uint256 id, uint256 amount, address to);
    event RarebitBunniesNativeChanged(address rarebitBunniesNative);
    event PtokenChanged(address pToken);

    function setRarebitBunniesNative(address _rarebitBunniesNative) external onlyOwner {
        rarebitBunniesNative = _rarebitBunniesNative;
        emit RarebitBunniesNativeChanged(rarebitBunniesNative);
    }

    function setPtoken(address _pToken) external onlyOwner {
        pToken = _pToken;
        emit PtokenChanged(pToken);
    }

    function uri(uint256 _id) external view override returns (string memory) {
        return _uris[_id];
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
        if (_from == address(0) && _msgSender() == pToken) {
            (, bytes memory userData, , address originatingAddress) = abi.decode(_userData, (bytes1, bytes, bytes4, address));
            require(originatingAddress == rarebitBunniesNative, "RarebitBunniesNative: Invalid originating address");
            (uint256 id, uint256 amount, address _to, string memory uri) = abi.decode(userData, (uint256, uint256, address, string));
            _mint(_to, id, amount, ""); // TODO: handle "" data
            _uris[id] = uri;
        }
    }

    function initialize(address _pToken, string memory _uri) public {
        pToken = _pToken;
        _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        __Ownable_init();
        __ERC1155_init(_uri);
    }

    function burn(
        uint256 _id,
        uint256 _amount,
        address _to
    ) public returns (bool) {
        // TODO: understand if we should burn a minimum amont of pToken
        _burn(_msgSender(), _id, _amount);
        bytes memory data = abi.encode(_id, _amount, _to);
        IPToken(pToken).redeem(0, data, Utils.toAsciiString(rarebitBunniesNative));
        emit Burned(_id, _amount, _to);
        return true;
    }
}
