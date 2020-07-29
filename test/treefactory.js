const TreeFactory = artifacts.require("TreeFactory");
const TreeSale = artifacts.require("TreeSale");
const Fund = artifacts.require("Fund");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');


contract('TreeFactory', (accounts) => {
    let treeInstance;
    let treeSaleInstance;
    let fundInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const secondAccount = accounts[2];
    const planterAccount  = accounts[3];
    const adminAccount = accounts[5];


    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
        treeSaleInstance = await TreeSale.new(treeInstance.address, { from: deployerAccount });
        fundInstance = await Fund.new(treeInstance.address, treeSaleInstance.address, { from: deployerAccount });    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("should add tree", async () => {
        let name = 'firstTree';


        await Common.addPlanter(treeInstance, ownerAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, ownerAccount, name);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0' && ev.name === name;
        });

    });

    it("should plant from funded trees", async () => {

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount });

        await fundInstance.fund(2, { from: secondAccount, value: price * 2 });

        await Common.addPlanter(treeInstance, planterAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, planterAccount);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0';
        });

    });

    it("should return owner tree count", async () => {

        await Common.addPlanter(treeInstance, ownerAccount, deployerAccount);
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

        await Common.addPlanter(treeInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        await Common.addPlanter(treeInstance, secondAccount, deployerAccount);
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

        await Common.addPlanter(treeInstance, ownerAccount, deployerAccount);
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

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        let tx = await treeInstance.setPrice(price, { from: adminAccount })

        truffleAssert.eventEmitted(tx, 'PriceChanged', (ev) => {
            return ev.price.toString() === price;
        });

    });

    it("should return tree price", async () => {

        Common.addAdmin(treeInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.03', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount })

        return await treeInstance.getPrice({ from: ownerAccount })
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

        await Common.addPlanter(treeInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount, name);

        return await treeInstance.getTree(0, { from: ownerAccount })
            .then(tree => {
                assert.equal(
                    tree[9],
                    ownerAccount
                );

                assert.equal(
                    tree[0],
                    name
                );
            });
    });


});