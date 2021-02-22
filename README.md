# :cyclone: portals-contracts

Repository containing pNetwork Portals smart contracts.

&nbsp;

***

&nbsp;

## :guardsman: Smart Contract Tests

```
❍ npm install install
```

```
❍ npm run test
```


&nbsp;

***

&nbsp;

## :white_check_mark: How to publish & verify

Create an __.env__ file with the following fields:

```
MAINNET_PRIVATE_KEY=
ROPSTEN_PRIVATE_KEY=
INFURA_KEY=
ETHERSCAN_API_KEY=
```


### publish


```
❍ npx hardhat run --network mainnet scripts/deploy-script.js
```

### verify

```
❍ npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```
