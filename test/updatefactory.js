const AccessRestriction = artifacts.require("AccessRestriction");
const UpdateFactory = artifacts.require("UpdateFactory");
const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('UpdateFactory', (accounts) => {
    let arInstance;
    let updateInstance;
    let treeInstance;
    let gbInstance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const planterAccount = accounts[2];
    const otherPlanterAccount = accounts[3];
    const ambAccount = accounts[4];
    const other2PlanterAccount = accounts[5];


    beforeEach(async () => {

        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address, ''], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        await treeInstance.setGBAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });
        
        await updateInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
        await updateInstance.setGBFactoryAddress(gbInstance.address, { from: deployerAccount });

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


    it("should accept update by admin", async () => {

        Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount);

        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: ownerAccount });


        let tx1 = await updateInstance.acceptUpdate(0, { from: deployerAccount });


        truffleAssert.eventEmitted(tx1, 'UpdateAccepted', (ev) => {
            return ev.updateId.toString() === '0' && ev.byWho.toString() === deployerAccount;
        });

    });

    it("should accept update by other planter of GB", async () => {

        Common.addPlanter(arInstance, planterAccount, deployerAccount);
        Common.addPlanter(arInstance, otherPlanterAccount, deployerAccount);
        Common.addAmbassador(arInstance, ambAccount, deployerAccount);

        Common.addGB(gbInstance, ambAccount, [planterAccount, otherPlanterAccount], 'title - test' )

        Common.addTree(treeInstance, planterAccount);

        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: planterAccount });


        let tx1 = await updateInstance.acceptUpdate(0, { from: otherPlanterAccount });


        truffleAssert.eventEmitted(tx1, 'UpdateAccepted', (ev) => {
            return ev.updateId.toString() === '0' && ev.byWho.toString() === otherPlanterAccount;
        });

    });

    it("can't accept update by other GB ", async () => {

        Common.addPlanter(arInstance, planterAccount, deployerAccount);
        Common.addPlanter(arInstance, otherPlanterAccount, deployerAccount);
        Common.addAmbassador(arInstance, ambAccount, deployerAccount);

        Common.addGB(gbInstance, ambAccount, [planterAccount, otherPlanterAccount], 'title - test')

        Common.addTree(treeInstance, planterAccount);

        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: planterAccount });


        Common.addPlanter(arInstance, other2PlanterAccount, deployerAccount);


        return await updateInstance.acceptUpdate(0, { from: other2PlanterAccount })
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'only one of planters of that greenBlock can accept update!',
                    'should throw an exception.'
                )
            });


        

    });



});