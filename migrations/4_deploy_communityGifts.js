require("dotenv").config();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const AccessRestriction = artifacts.require("AccessRestriction.sol");
const CommunityGifts = artifacts.require("CommunityGifts.sol");

module.exports = async function (deployer, network, accounts) {
  let accessRestrictionAddress = AccessRestriction.address;

  const now = parseInt(new Date().getTime() / 1000);
  const expireDate = now + 30 * 24 * 60 * 60; //one month after now
  const initialPlanterFund = web3.utils.toWei("0.5");
  const initialReferralFund = web3.utils.toWei("0.1");

  console.log("Deploying Community Gifts...");
  await deployProxy(
    CommunityGifts,
    [
      accessRestrictionAddress,
      expireDate,
      initialPlanterFund,
      initialReferralFund,
    ],
    {
      deployer,
      initializer: "initialize",
      unsafeAllowCustomTypes: true,
    }
  ).then(() => {});
};
