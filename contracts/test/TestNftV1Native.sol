//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../interfaces/IPERC20Vault.sol";


contract TestNftV1Native {
    using SafeERC20 for IERC20;

    IERC1155 nft;
    IPERC20Vault vault;
    IERC20 token;
    address owner;
    uint256 public minTokenAmountToPegIn;

    event PegIn(uint256 id, uint256 nftAmount, uint256 tokenAmount, string to);
    event MinTokenAmountToPegInChanged(uint256 minTokenAmountToPegIn);

    modifier onlyOwner() {
        require(owner == msg.sender, "TestNftV1Native: caller is not the owner");
        _;
    }

    function setMinTokenAmountToPegIn(uint256 _minTokenAmountToPegIn) external onlyOwner returns (bool) {
        minTokenAmountToPegIn = _minTokenAmountToPegIn;
        emit MinTokenAmountToPegInChanged(minTokenAmountToPegIn);
        return true;
    }

    function initialize(
        address _nft,
        address _vault,
        address _token
    ) public {
        owner = msg.sender;
        nft = IERC1155(_nft);
        vault = IPERC20Vault(_vault);
        token = IERC20(_token);
    }

    function pegIn(
        uint256 _id,
        uint256 _nftAmount,
        uint256 _tokenAmount,
        string calldata _to
    ) public returns (bool) {
        nft.safeTransferFrom(msg.sender, address(this), _id, _nftAmount, "");
        token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
        // TODO: encode nft metadata... uri or what else ??
        vault.pegIn(_tokenAmount, address(token), _to, "");
        emit PegIn(_id, _nftAmount, _tokenAmount, _to);
        return true;
    }
}
