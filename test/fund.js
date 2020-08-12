const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
const TreeSale = artifacts.require("TreeSale");
const Fund = artifacts.require("Fund");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');


contract('Fund', (accounts) => {
    let gbInstance;
    let treeInstance;
    let treeSaleInstance;
    let instance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const secondAccount = accounts[2];
    const adminAccount = accounts[3];
    const ambassadorAccount = accounts[4];
    const planterAccount = accounts[5];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
        gbInstance = await GBFactory.new({ from: deployerAccount });
        treeSaleInstance = await TreeSale.new(treeInstance.address, { from: deployerAccount });
        instance = await Fund.new(treeInstance.address, treeSaleInstance.address, { from: deployerAccount });
        await instance.setGBAddress(gbInstance.address, { from: deployerAccount });
    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });


    // it("should buy a tree", async () => {

    //     addTree('firstTree');
    //     let price = Units.convert('0.01', 'eth', 'wei');


    //     let tx = await instance.buy(0,
    //         { from: secondAccount, value: price });

    //     truffleAssert.eventEmitted(tx, 'TreeBought', (ev) => {
    //         return ev.saleId.toString() === '0' && ev.treeId.toString() === '0' && ev.price.toString() === price.toString() && ev.newOwner.toString() === secondAccount.toString();
    //     });

    // });

    it("should fund a tree from planted trees", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        await Common.addAdmin(treeInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        await Common.addAmbassador(gbInstance, ambassadorAccount, deployerAccount);
        await Common.addPlanter(gbInstance, planterAccount, deployerAccount);
        await Common.addPlanter(treeInstance, planterAccount, deployerAccount);

        
        await Common.addGB(gbInstance, ambassadorAccount, [planterAccount], 'firstGb');

        await Common.addTree(treeInstance, planterAccount);

        let tx = await instance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {

            if (ev.treeId.toString() === '0') {
                return ev.treeId.toString() === '0' && ev.balance.toString() === (balance.toString() * 45 / 100).toString() ;
            } else {
                return ev.treeId.toString() === '1' && ev.balance.toString() === (balance.toString() * 40 / 100).toString();
            }
        });

    });


    it("should fund a tree", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);    
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        let tx = await instance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {
            return ev.treeId.toString() === '0' && ev.balance.toString() === (balance.toString() * 40 / 100).toString();
        });

    });


    it("should return balance of wallets", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        let tx = await instance.fund(count,
            { from: secondAccount, value: price });

        return await instance.getBalances()
            .then((balances) => {
                assert.equal(
                    balances[0],
                    (balance.toString() * 25 / 100 * 2).toString(),
                    "GB with id: " + balances[0] + " returned"
                );

                assert.equal(
                    balances[1],
                    (balance.toString() * 40 / 100 * 2).toString(),
                    "GB with id: " + balances[1] + " returned"
                );

                assert.equal(
                    balances[2],
                    0,
                    "GB with id: " + balances[2] + " returned"
                );

                assert.equal(
                    balances[3],
                    (balance.toString() * 15 / 100 * 2 ).toString(),
                    "GB with id: " + balances[3] + " returned"
                );

                assert.equal(
                    balances[4],
                    (balance.toString() * 10 / 100 * 2).toString(),
                    "GB with id: " + balances[4] + " returned"
                );

                assert.equal(
                    balances[5],
                    (balance.toString() * 5 / 100 * 2).toString(),
                    "GB with id: " + balances[5] + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

    });


});