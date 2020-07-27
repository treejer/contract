const O2Factory = artifacts.require("O2Factory");
const GBFactory = artifacts.require("GBFactory");
const TreeType = artifacts.require("TreeType");
const TreeFactory = artifacts.require("TreeFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");


contract('O2Factory', (accounts) => {
    let o2Instance;
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
        treeTypeInstance = await TreeType.new({ from: deployerAccount });
        gbInstance = await GBFactory.new({ from: deployerAccount });
        treeInstance = await TreeFactory.new({ from: deployerAccount });
        updateInstance = await UpdateFactory.new({ from: deployerAccount });
        o2Instance = await O2Factory.new(treeTypeInstance.address, treeInstance.address, updateInstance.address, { from: deployerAccount });
    });

    afterEach(async () => {
        // await o2Instance.kill({ from: ownerAccount });
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function addTree(name = null) {
        Common.addType(treeTypeInstance, adminAccount);

        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        await sleep(1000);
        Common.addUpdate(updateInstance, ownerAccount);
        Common.acceptUpdate(updateInstance, adminAccount);
    }

    async function addTree2Update(name = null) {
        Common.addType(treeTypeInstance, adminAccount);

        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        await sleep(1000);
        Common.addUpdate(updateInstance, ownerAccount);
        Common.acceptUpdate(updateInstance, adminAccount);
        await sleep(1000);
        Common.addUpdate(updateInstance, ownerAccount);
        Common.acceptUpdate(updateInstance, adminAccount, 1);
    }


    async function add2Tree2Update(name = null) {
        Common.addType(treeTypeInstance, adminAccount);

        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount);

        await sleep(1000);
        Common.addUpdate(updateInstance, ownerAccount, 0);
        Common.addUpdate(updateInstance, ownerAccount, 1);

        Common.acceptUpdate(updateInstance, adminAccount, 0);
        Common.acceptUpdate(updateInstance, adminAccount, 1);

        await sleep(1000);
        Common.addUpdate(updateInstance, ownerAccount, 0);
        Common.addUpdate(updateInstance, ownerAccount, 1);

        Common.acceptUpdate(updateInstance, adminAccount, 2);
        Common.acceptUpdate(updateInstance, adminAccount, 3);

    }


    it("should mint o2", async () => {
        let titleTree = 'firstTree';

        await addTree(titleTree);

        let tx = await o2Instance.mint({ from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === ownerAccount && ev.totalO2.toString() === '100';
        });
    });

    it("should not mint o2 second time", async () => {
        let titleTree = 'firstTree';

        await addTree(titleTree);

        await o2Instance.mint({ from: ownerAccount });


        await o2Instance.mint({ from: ownerAccount })
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'MintableO2 is zero',
                    'second mint should throw an exception.'
                )
            });
    });


    it("should mint o2 twice", async () => {
        let titleTree = 'secondTree';

        await addTree2Update(titleTree);

        let tx = await o2Instance.mint({ from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === ownerAccount && ev.totalO2.toString() === '200';
        });
    });


    it("should mint o2 with 2 tree and 2 update", async () => {
        let titleTree = 'secondTree';

        await add2Tree2Update(titleTree);

        let tx = await o2Instance.mint({ from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === ownerAccount && ev.totalO2.toString() === '400';
        });
    });


    it('should return balance of planter', async () => {

        let titleTree = 'firstTree';
        await addTree(titleTree);

        await o2Instance.mint({ from: ownerAccount });

        return await o2Instance.balanceOf(ownerAccount, { from: ownerAccount })
            .then((balance) => {
                assert.equal(
                    '100',
                    balance,
                    "Balance of planter: " + balance
                );
            }).catch((error) => {
                console.log(error);
            });
    });

});