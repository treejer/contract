const AccessRestriction = artifacts.require("AccessRestriction");
const UpdateFactory = artifacts.require("UpdateFactory");
const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('UpdateFactory', (accounts) => {
    let arInstance;
    let updateInstance;
    let treeInstance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];

    beforeEach(async () => {

        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        await updateInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });

    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("should add updates", async () => {

        Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount);

        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'UpdateAdded', (ev) => {
            return ev.updateId.toString() === '0' && ev.treeId.toString() === treeId.toString() && ev.imageHash.toString() === imageHash.toString();
        });

    });


    it("should accept update", async () => {

        Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount);

        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: ownerAccount });


        let tx1 = await updateInstance.acceptUpdate(0, { from: deployerAccount });


        truffleAssert.eventEmitted(tx1, 'UpdateAccepted', (ev) => {
            return ev.updateId.toString() === '0';
        });

    });



});