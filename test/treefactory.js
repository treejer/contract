const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('TreeFactory', (accounts) => {
    let arInstance;
    let treeInstance;
    let gbInstance;
    let updateInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const secondAccount = accounts[2];
    const planterAccount  = accounts[3];
    const adminAccount = accounts[5];
    const ambassadorAccount = accounts[6];
    const admin2Account = accounts[7];


    beforeEach(async () => {
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        await treeInstance.setGBAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });
        await updateInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });

    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("should add tree", async () => {
        let name = 'firstTree';


        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, ownerAccount, name);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0' && ev.name === name;
        });

    });

    it("should plant from funded trees", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount });

        await treeInstance.fund(2, { from: secondAccount, value: price * 2 });

        await Common.addPlanter(arInstance, planterAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, planterAccount);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0';
        });

    });

    it("should return owner tree count", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        return await treeInstance.ownerTreesCount(ownerAccount, { from: ownerAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Owner tree counts are: " + count.toString()
                );
            });
    });

    it("should return owner trees", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        await Common.addPlanter(arInstance, secondAccount, deployerAccount);
        await Common.addTree(treeInstance, secondAccount);

        await Common.addTree(treeInstance, ownerAccount);

        return await treeInstance.getOwnerTrees(ownerAccount, { from: ownerAccount })
            .then(ownerTrees => {
                
                assert.equal(
                    ownerTrees[0],
                    0,
                    "First tree id must 0" 
                );

                assert.equal(
                    ownerTrees[1],
                    2,
                    "second tree id must 2"
                );
            });
    });


    it("should return tree owner", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        return await treeInstance.treeOwner(0, { from: ownerAccount })
            .then(ownerAddress => {
                assert.equal(
                    ownerAccount,
                    ownerAddress,
                    "Tree owner is: " + ownerAddress
                );
            });
    });

    it("should update tree price", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        let tx = await treeInstance.setPrice(price, { from: adminAccount })

        truffleAssert.eventEmitted(tx, 'PriceChanged', (ev) => {
            return ev.price.toString() === price;
        });

    });

    it("should return tree price", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.03', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount })

        return await treeInstance.price({ from: ownerAccount })
            .then(treePrice => {
                assert.equal(
                    treePrice,
                    price,
                    "Price: " + treePrice
                );
            });
    });

    it("should return tree data", async () => {

        let name = "testTree";

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount, name);

        return await treeInstance.trees(0, { from: ownerAccount })
            .then(tree => {
                assert.equal(
                    tree[0],
                    name
                );
            });
    });

    it("should fund a tree from planted trees", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        await Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        await Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        await Common.addPlanter(arInstance, planterAccount, deployerAccount);

        await Common.addGB(gbInstance, ambassadorAccount, [planterAccount], 'firstGb');

        await Common.addTree(treeInstance, planterAccount);

        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {

            if (ev.treeId.toString() === '0') {
                return ev.treeId.toString() === '0' && ev.planterBalance.toString() === (balance.toString() * 45 / 100).toString();
            } else {
                return ev.treeId.toString() === '1' && ev.planterBalance.toString() === (balance.toString() * 40 / 100).toString();
            }
        });

    });


    it("should fund a tree", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {
            return ev.treeId.toString() === '0' && ev.planterBalance.toString() === (balance.toString() * 40 / 100).toString();
        });

    });


    it("should update balance of wallets", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        return await treeInstance.getBalances()
            .then((balances) => {
                assert.equal(
                    balances[0],
                    (balance.toString() * 25 / 100 * 2).toString(),
                    "Balance " + balances[0] + " returned"
                );

                assert.equal(
                    balances[1],
                    (balance.toString() * 40 / 100 * 2).toString(),
                    "Balance " + balances[1] + " returned"
                );

                assert.equal(
                    balances[2],
                    0,
                    "Balance " + balances[2] + " returned"
                );

                assert.equal(
                    balances[3],
                    (balance.toString() * 15 / 100 * 2).toString(),
                    "Balance " + balances[3] + " returned"
                );

                assert.equal(
                    balances[4],
                    (balance.toString() * 10 / 100 * 2).toString(),
                    "Balance " + balances[4] + " returned"
                );

                assert.equal(
                    balances[5],
                    (balance.toString() * 5 / 100 * 2).toString(),
                    "Balance " + balances[5] + " returned"
                );
                
            }).catch((error) => {
                console.log(error);
            });

    });

    it("should withdraw treejer fund", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });


        let beforeWithdraw = await web3.eth.getBalance(admin2Account);

        await treeInstance.withdrawBalance(0, admin2Account,
            { from: deployerAccount });

        return await web3.eth.getBalance(admin2Account)
            .then((balanceEther) => {

                assert.equal(
                    balanceEther,
                    (parseInt(beforeWithdraw) + parseInt(balance.toString() * 25 / 100 * 2)).toString(),
                    "Ether balance: " + balanceEther + " returned"
                );

            }).catch((error) => {
                console.log(error);
            });

    });


    it("should withdraw planter fund", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        Common.addPlanter(arInstance, planterAccount, deployerAccount);

        Common.addTree(treeInstance, planterAccount, 'first');
        Common.addTree(treeInstance, planterAccount, 'second');

        await Common.sleep(1000);

        Common.addUpdate(updateInstance, planterAccount, 0);
        Common.acceptUpdate(updateInstance, deployerAccount, 0);

        Common.addUpdate(updateInstance, planterAccount, 1);
        Common.acceptUpdate(updateInstance, deployerAccount, 1);

        await treeInstance.fund(count,
            { from: secondAccount, value: price });


        let tx = await treeInstance.withdrawPlanterBalance({ from: planterAccount });

        truffleAssert.eventEmitted(tx, 'PlanterBalanceWithdrawn', (ev) => {
            return ev.amount.toString() === '84559444' && ev.planter === planterAccount;
        });

    });

    it("should withdraw ambassador fund", async () => {

        let price = Units.convert('0.03', 'eth', 'wei');
        let count = 3;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        Common.addPlanter(arInstance, planterAccount, deployerAccount);

        Common.addGB(gbInstance, ambassadorAccount, [planterAccount], 'GB GB');

        Common.addTree(treeInstance, planterAccount, 'first');

        //with two update
        Common.addTree(treeInstance, planterAccount, 'second');

        // without update
        Common.addTree(treeInstance, planterAccount, 'three');

        await Common.sleep(1000);

        Common.addUpdate(updateInstance, planterAccount, 0);
        Common.acceptUpdate(updateInstance, deployerAccount, 0);

        Common.addUpdate(updateInstance, planterAccount, 1);
        Common.acceptUpdate(updateInstance, deployerAccount, 1);

        await Common.sleep(1000);

        Common.addUpdate(updateInstance, planterAccount, 1);
        Common.acceptUpdate(updateInstance, deployerAccount, 2);


        await treeInstance.fund(count,
            { from: secondAccount, value: price });

        let tx = await treeInstance.withdrawAmbassadorBalance({ from: ambassadorAccount });

        truffleAssert.eventEmitted(tx, 'AmbassadorBalanceWithdrawn', (ev) => {
            return ev.amount.toString() === '15854895' && ev.ambassador === ambassadorAccount;
        });

    });



});