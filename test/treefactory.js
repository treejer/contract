const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');


contract('TreeFactory', (accounts) => {
    let treeInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const adminAccount = accounts[5];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("should add tree", async () => {
        let name = 'firstTree';


        await Common.addAmbassador(treeInstance, ownerAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, ownerAccount, name);

        truffleAssert.eventEmitted(tx, 'NewTreeAdded', (ev) => {
            return ev.id.toString() === '0' && ev.name === name;
        });

    });

    it("should return owner tree count", async () => {

        await Common.addAmbassador(treeInstance, ownerAccount, deployerAccount);
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


    it("should return tree owner", async () => {

        await Common.addAmbassador(treeInstance, ownerAccount, deployerAccount);
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


});