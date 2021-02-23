//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

interface IPToken {
    function redeem(
        uint256 amount,
        bytes memory data,
        string memory underlyingAssetRecipient
    ) external;
}
