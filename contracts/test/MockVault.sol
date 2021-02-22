//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";


contract MockVault is IERC777Recipient {
    using SafeERC20 for IERC20;

    IERC1820Registry private constant _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    event PegIn(address _tokenAddress, address _tokenSender, uint256 _tokenAmount, string _destinationAddress);

    constructor() {
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    function tokensReceived(
        address, /*operator*/
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata /*operatorData*/
    ) external override {
        address _tokenAddress = msg.sender;
        require(to == address(this), "Token receiver is not this contract");
        if (userData.length > 0) {
            require(amount > 0, "Token amount must be greater than zero!");
            (bytes32 tag, string memory _destinationAddress) = abi.decode(userData, (bytes32, string));
            require(tag == keccak256("ERC777-pegIn"), "Invalid tag for automatic pegIn on ERC777 send");
            emit PegIn(_tokenAddress, from, amount, _destinationAddress);
        }
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress
    ) external returns (bool) {
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        emit PegIn(_tokenAddress, msg.sender, _tokenAmount, _destinationAddress);
        return true;
    }
}
