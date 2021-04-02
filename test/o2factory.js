const AccessRestriction = artifacts.require("AccessRestriction");
const O2Factory = artifacts.require("O2Factory");
const GBFactory = artifacts.require("GBFactory");
const TreeType = artifacts.require("TreeType");
const TreeFactory = artifacts.require("TreeFactory");
const Tree = artifacts.require("Tree");
const O2 = artifacts.require("O2");
const UpdateFactory = artifacts.require("UpdateFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('O2Factory', (accounts) => {
    let arInstance;

    let o2Instance;
    let gbInstance;
    let treeInstance;
    let updateInstance;
    let treeTokenInstance;
    let o2TokenInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const ambassadorAccount = accounts[2];
    const planter1Account = accounts[3];
    const planter2Account = accounts[4];
    const planter3Account = accounts[5];
    const planter4Account = accounts[6];
    const planter5Account = accounts[7];
    const adminAccount = accounts[7];

    // const zeroAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {

        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeTypeInstance = await deployProxy(TreeType, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        o2Instance = await deployProxy(O2Factory, [arInstance.address], { initializer: 'initialize', from: deployerAccount });


        treeTokenInstance = await deployProxy(Tree, [arInstance.address, ''], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        o2TokenInstance = await deployProxy(O2, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });


        await treeInstance.setGBFactoryAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });
        await treeInstance.setTreeTokenAddress(treeTokenInstance.address, { from: deployerAccount });

        await o2Instance.setTreeTypeAddress(treeTypeInstance.address, { from: deployerAccount });
        await o2Instance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
        await o2Instance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });

        await o2Instance.setTreeTokenAddress(treeTokenInstance.address, { from: deployerAccount });
        await o2Instance.setO2TokenAddress(o2TokenInstance.address, { from: deployerAccount });

        await updateInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
        await updateInstance.setGBFactoryAddress(gbInstance.address, { from: deployerAccount });

        await Common.addTreeFactoryRole(arInstance, treeInstance.address, deployerAccount);
        await Common.addO2FactoryRole(arInstance, o2Instance.address, deployerAccount);


    });

    afterEach(async () => {
        // await o2Instance.kill({ from: ownerAccount });
    });

    async function addTree() {
        Common.addType(treeTypeInstance, deployerAccount);

        Common.addPlanter(arInstance, planter1Account, deployerAccount);

        Common.addGB(gbInstance, planter1Account, [planter1Account], 'title');

        Common.addTree(treeInstance, planter1Account);
        await Common.sleep(5000);
        
        Common.addUpdate(updateInstance, planter1Account);
        Common.acceptUpdate(updateInstance, deployerAccount);
    }

    async function addTree2Update() {
        Common.addType(treeTypeInstance, deployerAccount);

        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, planter1Account, [planter1Account]);


        Common.addTree(treeInstance, planter1Account);

        await Common.sleep(5000);
        Common.addUpdate(updateInstance, planter1Account);
        Common.acceptUpdate(updateInstance, deployerAccount);
        await Common.sleep(5000);
        Common.addUpdate(updateInstance, planter1Account);
        Common.acceptUpdate(updateInstance, deployerAccount, 1);
    }


    async function add2Tree2Update() {
        Common.addType(treeTypeInstance, deployerAccount);

        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, planter1Account, [planter1Account]);

        Common.addTree(treeInstance, planter1Account);
        Common.addTree(treeInstance, planter1Account);

        await Common.sleep(5000);
        Common.addUpdate(updateInstance, planter1Account, 0);
        Common.addUpdate(updateInstance, planter1Account, 1);

        Common.acceptUpdate(updateInstance, deployerAccount, 0);
        Common.acceptUpdate(updateInstance, deployerAccount, 1);

        await Common.sleep(5000);
        Common.addUpdate(updateInstance, planter1Account, 0);
        Common.addUpdate(updateInstance, planter1Account, 1);

        Common.acceptUpdate(updateInstance, deployerAccount, 2);
        Common.acceptUpdate(updateInstance, deployerAccount, 3);

    }


    it("should mint o2", async () => {

        await addTree();

        let tx = await o2Instance.mint({ from: planter1Account });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === planter1Account && ev.totalO2.toString() === '500';
        });
    });

    it("should not mint o2 second time", async () => {

        await addTree();


        await o2Instance.mint({ from: planter1Account });

        await o2Instance.mint({ from: planter1Account })
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

        await Common.sleep(1000);

        await addTree2Update( );

        let tx = await o2Instance.mint({ from: planter1Account });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === planter1Account && ev.totalO2.toString() === '1000';
        });
    });


    it("should mint o2 with 2 tree and 2 update", async () => {

        await Common.sleep(1000);

        await add2Tree2Update();

        let tx = await o2Instance.mint({ from: planter1Account });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === planter1Account && (ev.totalO2.toString() === '2000' || ev.totalO2.toString() === '1900');
        });
    });


    it('should return balance of planter', async () => {

        await addTree();

        await o2Instance.mint({ from: planter1Account });

        return await o2TokenInstance.balanceOf(planter1Account, { from: planter1Account })
            .then((balance) => {
                assert.equal(
                    '500',
                    balance,
                    "Balance of planter: " + balance
                );
            }).catch((error) => {
                console.log(error);
            });
    });

});