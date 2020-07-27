const TreeFactory = artifacts.require("TreeFactory");
const TreeSale = artifacts.require("TreeSale");
const Fund = artifacts.require("Fund");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');


contract('Fund', (accounts) => {
    let treeInstance;
    let treeSaleInstance;
    let instance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const secondAccount = accounts[2];
    const adminAccount = accounts[3];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
        treeSaleInstance = await TreeSale.new(treeInstance.address, { from: deployerAccount });
        instance = await Fund.new(treeInstance.address, treeSaleInstance.address, { from: deployerAccount });
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

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        Common.addTreeWithPlanter(treeInstance, ownerAccount, adminAccount);

        let tx = await instance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {
            return ev.treeId.toString() === '0' && ev.balance.toString() === balance.toString();
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
            return ev.treeId.toString() === '0' && ev.balance.toString() === balance.toString();
        });

    });

});