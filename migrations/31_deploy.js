const AccessRestriction = artifacts.require("AccessRestriction.sol");
const Planter = artifacts.require("Planter.sol");
const B = artifacts.require("B.sol");

const A = artifacts.require("A.sol");

const { deployProxy } = require("@openzeppelin/truffle-upgrades");
module.exports = async function (deployer, network, accounts) {
  const PLANTER_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  console.log("Deploying AccessRestriction...");
  await deployProxy(AccessRestriction, [accounts[0]], {
    deployer,
    initializer: "initialize",
    unsafeAllowCustomTypes: true,
  }).then(() => {
    console.log("ar address", AccessRestriction.address);
  });

  await AccessRestriction.deployed().then(async (instance) => {
    await instance.grantRole(PLANTER_ROLE, accounts[1], { from: accounts[0] });
    let result = await instance.hasRole.call(PLANTER_ROLE, accounts[1]);
    console.log("accounts[1]", accounts[1]);

    console.log("result", result);
  });

  // await deployProxy(Planter, [AccessRestriction.address], {
  //   deployer,
  //   initializer: "initialize",
  //   unsafeAllowCustomTypes: true,
  // }).then(() => {
  //   console.log("planter address", Planter.address);
  // });
  // await deployer.deploy(B);
  // await deployer.deploy(A);
  // let b = await B.deployed();
  // console.log("b.address", b.address);
};

