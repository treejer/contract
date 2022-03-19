const { admin } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network, accounts) {
  // Use address of your Gnosis Safe
  const gnosisSafe = process.env.SAFE_ADDRESS;

  // Don't change ProxyAdmin ownership for our test network
  if (network === "matic") {
    // The owner of the ProxyAdmin can upgrade our contracts
    await admin.transferProxyAdminOwnership(gnosisSafe);
  }
};
