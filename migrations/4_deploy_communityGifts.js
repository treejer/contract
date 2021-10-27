require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const HonoraryTree = artifacts.require("HonoraryTree.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  const initialReferralTreePaymentToPlanter = web3.utils.toWei("0.5");
  const initialReferralTreePaymentToAmbassador = web3.utils.toWei("0.1");

  console.log("Deploying HonoraryTree...");
  await deployProxy(
    HonoraryTree,
    [
      accessRestrictionAddress,
      initialReferralTreePaymentToPlanter,
      initialReferralTreePaymentToAmbassador,
    ],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {});
};
