pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";


contract MockPToken is ERC777 {
    address public pNetwork;

    event Redeem(address indexed redeemer, uint256 value, string underlyingAssetRecipient);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        address[] memory defaultOperators,
        address _pnetwork
    ) public ERC777(tokenName, tokenSymbol, defaultOperators) {
        pNetwork = _pnetwork;
    }

    function owner() internal view returns (address) {
        return pNetwork;
    }

    function changePNetwork(address newPNetwork) external {
        require(_msgSender() == pNetwork, "Only the pNetwork can change the `pNetwork` account!");
        require(newPNetwork != address(0), "pNetwork cannot be the zero address!");
        pNetwork = newPNetwork;
    }

    function mint(
        address recipient,
        uint256 value,
        bytes calldata userData,
        bytes calldata operatorData
    ) external returns (bool) {
        require(_msgSender() == pNetwork, "Only the pNetwork can mint tokens!");
        require(recipient != address(0), "pToken: Cannot mint to the zero address!");
        _mint(recipient, value, userData, operatorData);
        return true;
    }

    function redeem(uint256 amount, string calldata underlyingAssetRecipient) external returns (bool) {
        redeem(amount, "", underlyingAssetRecipient);
        return true;
    }

    function redeem(
        uint256 amount,
        bytes memory data,
        string memory underlyingAssetRecipient
    ) public {
        _burn(_msgSender(), amount, data, "");
        emit Redeem(msg.sender, amount, underlyingAssetRecipient);
    }

    function operatorRedeem(
        address account,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData,
        string calldata underlyingAssetRecipient
    ) external {
        require(isOperatorFor(_msgSender(), account), "ERC777: caller is not an operator for holder");
        _burn(account, amount, data, operatorData);
        emit Redeem(account, amount, underlyingAssetRecipient);
    }
}
