const TreeBox = artifacts.require("TreeBox.sol");

module.exports = async function (deployer, network, accounts) {
  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  await TreeBox.deployed().then(async (instance) => {
    await instance.grantRole(DEFAULT_ADMIN_ROLE, process.env.SAFE_ADDRESS);
    await instance.revokeRole(DEFAULT_ADMIN_ROLE, accounts[0]);
  });
};
