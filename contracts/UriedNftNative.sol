//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IPERC20Vault.sol";


contract UriedNftNativeV1 is ERC1155HolderUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    address public nft;
    address public vault;
    address public token;
    string public uriedNftHost;
    uint256 public minTokenAmountToPegIn;

    event PegIn(uint256 id, uint256 nftAmount, uint256 tokenAmount, string to);
    event MinTokenAmountToPegInChanged(uint256 minTokenAmountToPegIn);
    event UriedNftHostChanged(string uriedNftHost);

    function setMinTokenAmountToPegIn(uint256 _minTokenAmountToPegIn) external onlyOwner returns (bool) {
        minTokenAmountToPegIn = _minTokenAmountToPegIn;
        emit MinTokenAmountToPegInChanged(minTokenAmountToPegIn);
        return true;
    }

    function setUriedNftHost(string calldata _uriedNftHost) external onlyOwner returns (bool) {
        uriedNftHost = _uriedNftHost;
        emit UriedNftHostChanged(uriedNftHost);
        return true;
    }

    function initialize(
        address _nft,
        address _vault,
        address _token,
        string calldata _uriedNftHost
    ) public {
        nft = _nft;
        vault = _vault;
        token = _token;
        uriedNftHost = _uriedNftHost;
        __ERC1155Holder_init();
        __Ownable_init();
    }

    function pegIn(
        uint256 _id,
        uint256 _nftAmount,
        uint256 _tokenAmount,
        string calldata _to
    ) public returns (bool) {
        require(_nftAmount > 0, "UriedNftNativeV1: nftAmount must be greater than 0");
        require(
            _tokenAmount >= minTokenAmountToPegIn,
            "UriedNftNativeV1: tokenAmount is less than minTokenAmountToPegIn"
        );
        IERC1155(nft).safeTransferFrom(msg.sender, address(this), _id, _nftAmount, "");
        IERC20(token).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        string memory uri = IERC1155MetadataURI(nft).uri(_id);
        bytes memory encoded = abi.encode(_id, _nftAmount, _to, uri);
        IERC20(token).safeApprove(vault, _tokenAmount);
        IPERC20Vault(vault).pegIn(_tokenAmount, token, uriedNftHost, encoded);
        emit PegIn(_id, _nftAmount, _tokenAmount, _to);
        return true;
    }
}
