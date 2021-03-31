//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";


contract MockVault is IERC777Recipient {
    using SafeERC20 for IERC20;

    IERC1820Registry private constant _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    address public PNETWORK;

    event Minted(address _tokenAddress, address _tokenSender, uint256 _tokenAmount, string _destinationAddress, bytes _userData);

    constructor(address _pnetwork) {
        PNETWORK = _pnetwork;
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
            emit Minted(_tokenAddress, from, amount, _destinationAddress, userData);
        }
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress,
        bytes calldata _userData
    ) external returns (bool) {
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        emit Minted(_tokenAddress, msg.sender, _tokenAmount, _destinationAddress, _userData);
        return true;
    }

    // NOTE: in the reality should be called only by pNetwork
    function pegOut(
        address payable _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount,
        bytes calldata _userData
    ) external returns (bool) {
        IERC777(_tokenAddress).send(_tokenRecipient, _tokenAmount, _userData);
        return true;
    }
}
