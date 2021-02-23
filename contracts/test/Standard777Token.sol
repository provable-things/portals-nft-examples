//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";


contract Standard777Token is ERC777 {
    constructor(string memory _name, string memory _symbol) ERC777(_name, _symbol, new address[](0)) {
        _mint(msg.sender, 100000000 * 10**18, "", "");
    }
}
