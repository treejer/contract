const AccessRestriction = artifacts.require("AccessRestriction");
const O1Factory = artifacts.require("O1Factory");
const GBFactory = artifacts.require("GBFactory");
const TreeType = artifacts.require("TreeType");
const TreeFactory = artifacts.require("TreeFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');



contract('O1Factory', (accounts) => {
    let arInstance;
    let o1Instance;
    let gbInstance;
    let treeInstance;
    let updateInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const ambassadorAccount = accounts[2];
    const planter1Account = accounts[3];
    const planter2Account = accounts[4];
    const planter3Account = accounts[5];
    const planter4Account = accounts[6];
    const planter5Account = accounts[7];
    const adminAccount = accounts[7];

    beforeEach(async () => {
    
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        await treeInstance.setGBAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });

        o1Instance = await deployProxy(O1Factory, [arInstance.address], { initializer: 'initialize', from: deployerAccount });

        o1Instance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
    });

    afterEach(async () => {
        // await o1Instance.kill({ from: ownerAccount });
    });

    async function fundTree() {
        await o1Instance.setO1GeneratedPerSecond(1, { from: deployerAccount });
        await Common.fundTree(treeInstance, ownerAccount, 2);
    }

    it("should mint o1", async () => {

        fundTree();

        await Common.sleep(1000);

        let tx = await o1Instance.mint({ from: ownerAccount })

        truffleAssert.eventEmitted(tx, 'O1Minted', (ev) => {
            return ev.owner.toString() === ownerAccount && ev.totalO1.toString() === '2';
        });

    });


    it('should return balance of owner', async () => {

        fundTree();

        await Common.sleep(1000);

        await o1Instance.mint({ from: ownerAccount })

        return await o1Instance.balanceOf(ownerAccount, { from: ownerAccount })
            .then((balance) => {
                assert.equal(
                    '2',
                    balance,
                    "Balance of owner: " + balance
                );
            }).catch((error) => {
                console.log(error);
            });
    });

    //@todo shpoud check for last minign date


});