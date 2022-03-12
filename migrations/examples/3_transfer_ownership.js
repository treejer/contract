// https://forum.openzeppelin.com/t/openzeppelin-truffle-upgrades/3579

// const { admin } = require('@openzeppelin/truffle-upgrades');

// module.exports = async function (deployer, network) {
//     // Use address of your Gnosis Safe
//     const gnosisSafe = '';

//     // Don't change ProxyAdmin ownership for our test network
//     if (network !== 'test' || network !== 'development') {
//         // The owner of the ProxyAdmin can upgrade our contracts
//         await admin.transferProxyAdminOwnership(gnosisSafe);
//     }
// };
