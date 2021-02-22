// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract GameItems is ERC1155 {
    uint256 public constant GOLD = 0;

    constructor() ERC1155("uri") {
        _mint(msg.sender, GOLD, 1, "");
    }
}
