const AccessRestriction = artifacts.require("AccessRestriction");
const GBFactory = artifacts.require("GBFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Common = require("./common");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('GBFactory', (accounts) => {
    let arInstance;
    let gbInstance;
    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const ambassadorAccount = accounts[2];
    const planter1Account = accounts[3];
    const planter2Account = accounts[4];
    const planter3Account = accounts[5];
    const planter4Account = accounts[6];
    const planter5Account = accounts[7];
    const adminAccount = accounts[8];

    const plantersArray = [
        planter1Account,
        planter2Account,
        planter3Account,
        planter4Account,
        planter5Account
    ];

    beforeEach(async () => {
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

    });

    afterEach(async () => {
        // await gbInstance.kill({ from: ownerAccount });
    });

    it("should add gb", async () => {

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);

        let title = 'firstGB';
        let tx = await Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        truffleAssert.eventEmitted(tx, 'NewGBAdded', (ev) => {
            return ev.id.toString() === '1' && ev.title === title;
        });

    });

    it("should return ambassodar gb count", async () => {

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title');
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title2');

        return await gbInstance.ambassadorGBCount(ambassadorAccount, { from: ambassadorAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Ambassodar gb counts are: " + count.toString()
                );
            });
    });

    it("should return planter gb", async () => {

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, [planter2Account], 'title');
        Common.addGB(gbInstance, ambassadorAccount, [planter1Account], 'title');

        return await gbInstance.planterGB(planter1Account, { from: ambassadorAccount })
            .then(gbId => {
                assert.equal(
                    2,
                    gbId,
                    "planter gb is: " + gbId.toString()
                );
            });
    });

    it("should return gb", async () => {

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title');

        return await gbInstance.greenBlocks(1, { from: ambassadorAccount })
            .then(greenBlock => {
                assert.equal(
                    'title',
                    greenBlock[0],
                    "greenBlock title is: " + greenBlock[0]
                );
            });
    });



    it("should return gb ambassador", async () => {

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title');

        return await gbInstance.gbToAmbassador(1, { from: ambassadorAccount })
            .then(ambassadorAddress => {
                assert.equal(
                    ambassadorAccount,
                    ambassadorAddress,
                    "GB ambassador is: " + ambassadorAddress
                );
            });
    });

    it('should return greenblock', async () => {
        let title = 'firsGB';
        let id = 1;

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        return await gbInstance.greenBlocks(id)
            .then((greenBlock) => {
                assert.equal(
                    greenBlock[0],
                    title,
                    "GB with id: " + id + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });
    });

    it('should activate greenblock', async () => {
        let title = 'firsGB';
        let id = 1;

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let tx = await gbInstance.activate(id, { from: adminAccount });

        truffleAssert.eventEmitted(tx, 'GBActivated', (ev) => {
            return ev.id.toString() === id.toString();
        });
    });

    it('should join GB', async () => {
        let title = 'firsGB';
        let id = 1;

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        Common.addPlanter(arInstance, planter2Account, deployerAccount);
        let tx = await gbInstance.joinGB(id, { from: planter2Account });

        truffleAssert.eventEmitted(tx, 'PlanterJoinedGB', (ev) => {
            return ev.id.toString() === id.toString() && ev.planter === planter2Account;
        });
    });


    it("should not create gb when paused", async () => {
        let title = 'firstGB';
        let titleTree = 'firstTree';

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        arInstance.pause({ from: adminAccount });

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);

        await Common.addGB(gbInstance, ambassadorAccount, plantersArray, title)
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'Pausable: paused.',
                    'add gb when paused shoud retrun exception'
                )
            });

    });

    it("should not create gb when not hasRole", async () => {


        let title = 'firstGB';

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);

        await await Common.addGB(gbInstance, planter1Account, plantersArray, title)
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'Caller is not a planter or ambassador.',
                    'add gb when paused shoud retrun exception'
                )
            });

    });

    it("should not join GB again to gb!", async () => {


        let title = 'firstGB';

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);

        await await Common.addGB(gbInstance, planter1Account, plantersArray, title)
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'Caller is not a planter or ambassador.',
                    'add gb when paused shoud retrun exception'
                )
            });

    });


    it('should join GB', async () => {
        let title = 'firsGB';
        let id = 1;

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addPlanter(arInstance, planter1Account, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        Common.addPlanter(arInstance, planter2Account, deployerAccount);
        let tx = await gbInstance.joinGB(id, { from: planter2Account });

        await gbInstance.joinGB(id, { from: planter2Account })
            .then(assert.fail)
            .catch(error => {
                console.log(error.message);

                assert.include(
                    error.message,
                    'Joined before',
                    'joining again must throw exception'
                )
            });
    });


});