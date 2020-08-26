//https://forum.openzeppelin.com/t/openzeppelin-truffle-upgrades/3579

// var TreeFactory = artifacts.require("TreeFactory.sol");
// var TreeFactoryV2 = artifacts.require("TreeFactoryV2.sol");

// const { upgradeProxy, prepareUpgrade } = require('@openzeppelin/truffle-upgrades');

// module.exports = async function (deployer) {
//     const treeFactory = await TreeFactory.deployed();
    
//     // upgrade direct
//     await upgradeProxy(treeFactory.address, TreeFactoryV2, { deployer, unsafeAllowCustomTypes:true });

//     // prepare upgrade with nosis
//     await prepareUpgrade(treeFactory.address, TreeFactoryV2, { deployer, unsafeAllowCustomTypes: true });

// };