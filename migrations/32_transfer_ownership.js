require("dotenv").config();
const { admin } = require("@openzeppelin/truffle-upgrades");

module.exports = async function (deployer, network, accounts) {
  // Use address of your Gnosis Safe

  // Don't change ProxyAdmin ownership for our test network
  if (network != "development") {
    const gnosisSafe = eval(
      `process.env.SAFE_ADDRESS_${network.toUpperCase()}`
    );

    // The owner of the ProxyAdmin can upgrade our contracts
    await admin.transferProxyAdminOwnership(gnosisSafe);
  }
};
