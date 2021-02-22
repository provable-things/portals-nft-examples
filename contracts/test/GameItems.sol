// SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";


contract GameItems is ERC1155 {
    uint256 public constant GOLD = 0;

    constructor() ERC1155("https://abcoathup.github.io/SampleERC1155/api/token/{id}.json") {
        _mint(msg.sender, GOLD, 10**18, "");
    }
}
