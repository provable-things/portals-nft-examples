//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IPERC20Vault.sol";


contract BasicERC1155Native is ERC1155HolderUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public erc1155;
    address public erc777;
    address public vault;
    string public basicERC1155Host;
    uint256 public minTokenAmountToPegIn;

    event PegIn(uint256 id, uint256 nftAmount, uint256 tokenAmount, string to);
    event MinTokenAmountToPegInChanged(uint256 minTokenAmountToPegIn);
    event BasicERC1155HostFactoryChanged(string basicERC1155Host);

    function setMinTokenAmountToPegIn(uint256 _minTokenAmountToPegIn) external onlyOwner returns (bool) {
        minTokenAmountToPegIn = _minTokenAmountToPegIn;
        emit MinTokenAmountToPegInChanged(minTokenAmountToPegIn);
        return true;
    }

    function setBasicERC1155HostFactory(string calldata _basicERC1155Host) external onlyOwner returns (bool) {
        basicERC1155Host = _basicERC1155Host;
        emit BasicERC1155HostFactoryChanged(basicERC1155Host);
        return true;
    }

    function initialize(
        address _erc1155,
        address _vault,
        address _erc777,
        string memory _basicERC1155Host
    ) public {
        erc1155 = _erc1155;
        vault = _vault;
        erc777 = _erc777;
        basicERC1155Host = _basicERC1155Host;
        __ERC1155Holder_init();
        __Ownable_init();
    }

    function pegIn(
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
        bytes memory encoded = abi.encode(_id, _nftAmount, _to);
        IERC20(erc777).safeApprove(vault, _tokenAmount);
        IPERC20Vault(vault).pegIn(_tokenAmount, erc777, basicERC1155Host, encoded);
        emit PegIn(_id, _nftAmount, _tokenAmount, _to);
        return true;
    }
}
