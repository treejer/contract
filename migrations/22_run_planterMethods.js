require("dotenv").config();

const Planter = artifacts.require("PlanterV2.sol");
const MarketPlace = artifacts.require("MarketPlace.sol");

module.exports = async function (deployer, network, accounts) {
  const isLocal = network === "development";

  let marketPlaceAddress = MarketPlace.address;
  //gsn
  let trustedForwarder;

  if (isLocal) {
    trustedForwarder = require("../build/gsn/Forwarder.json").address;
  } else {
    trustedForwarder = eval(
      `process.env.GSN_FORWARDER_${network.toUpperCase()}`
    );
  }

  console.log("Call Planter Methods...");
  await Planter.deployed().then(async (instance) => {
    await instance.setMarketPlaceAddress(marketPlaceAddress);
    await instance.setTrustedForwarder(trustedForwarder);
  });
};
