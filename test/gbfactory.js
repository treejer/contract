const GBFactory = artifacts.require("GBFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Common = require("./common");

contract('GBFactory', (accounts) => {
    let gbInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
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
        gbInstance = await GBFactory.new({ from: deployerAccount });
    });

    afterEach(async () => {
        // await gbInstance.kill({ from: ownerAccount });
    });

    it("should add gb", async () => {

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);

        let title = 'firstGB';
        let tx = await Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        truffleAssert.eventEmitted(tx, 'NewGBAdded', (ev) => {
            return ev.id.toString() === '0' && ev.title === title;
        });

    });

    it("should return ambassodar gb count", async () => {

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title');
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title2');

        return await gbInstance.getAmbassadorGBCount({ from: ambassadorAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Ambassodar gb counts are: " + count.toString()
                );
            });
    });


    it("should return gb ambassador", async () => {

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, 'title');

        return await gbInstance.getGBAmbassador(0, { from: ambassadorAccount })
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
        let id = 0;

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        return await gbInstance.getGB(id)
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
        let id = 0;

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);
        Common.addGB(gbInstance, ambassadorAccount, plantersArray, title);

        Common.addAdmin(gbInstance, adminAccount, deployerAccount);

        let tx = await gbInstance.activate(id, { from: adminAccount });

        truffleAssert.eventEmitted(tx, 'GBActivated', (ev) => {
            return ev.id.toString() === id.toString();
        });
    });


    it("should not create gb when paused", async () => {
        let title = 'firstGB';
        let titleTree = 'firstTree';

        Common.addAdmin(gbInstance, adminAccount, deployerAccount);
        gbInstance.pause({ from: adminAccount });

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);

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

        Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);

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




});