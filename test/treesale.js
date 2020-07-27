const TreeFactory = artifacts.require("TreeFactory");
const TreeSale = artifacts.require("TreeSale");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");


contract('TreeSale', (accounts) => {
    let treeSaleInstance;
    let treeInstance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const secondAccount = accounts[2];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
        treeSaleInstance = await TreeSale.new(treeInstance.address, { from: deployerAccount });
    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("should add to tree sales list", async () => {

        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);

        let treeId = 0;
        let price = Units.convert('0.01', 'eth', 'wei');
        let tx = await treeSaleInstance.addToSalesList(
            treeId,
            price,
            { from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'TreeAddedToSalesList', (ev) => {
            return ev.id.toString() === '0' && ev.treeId.toString() === treeId.toString() && ev.price.toString() === price.toString();
        });

    });

    it("should not add to tree sales list, because it is not owner of tree", async () => {

        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        let treeId = 0;

        let price = Units.convert('0.01', 'eth', 'wei');

        let tx = await treeSaleInstance.addToSalesList(
            treeId,
            price,
            { from: secondAccount })
            .then(assert.fail)
            .catch(error => {
                assert.include(
                    error.message,
                    'Only owner of tree authorized',
                    'add to list should throw an exception.'
                )
            });

    });


    it('should return count of tree sales list', async () => {
        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount, 'secondTree');

        await treeSaleInstance.addToSalesList(
            0,
            Units.convert('0.01', 'eth', 'wei'),
            { from: ownerAccount });

        await treeSaleInstance.addToSalesList(
            1,
            Units.convert('0.02', 'eth', 'wei'),
            { from: ownerAccount });

        return await treeSaleInstance.salesListCount()
            .then((count) => {
                assert.equal(
                    2,
                    count,
                    "Tree sales list count is: " + count
                );
            }).catch((error) => {
                console.log(error);
            });
    });


    it('should remove tree from sales list', async () => {
        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);
        Common.addTree(treeInstance, ownerAccount, 'secondTree');
        Common.addTree(treeInstance, ownerAccount, 'thirdTree');

        await treeSaleInstance.addToSalesList(
            0,
            Units.convert('0.01', 'eth', 'wei'),
            { from: ownerAccount });

        await treeSaleInstance.addToSalesList(
            1,
            Units.convert('0.02', 'eth', 'wei'),
            { from: ownerAccount });

        await treeSaleInstance.addToSalesList(
            2,
            Units.convert('0.03', 'eth', 'wei'),
            { from: ownerAccount });


        let tx = await treeSaleInstance.removeFromSalesList(1);

        truffleAssert.eventEmitted(tx, 'TreeRemovedFromSalesList', (ev) => {
            return ev.treeId.toString() === '1';
        });

    });

    it('should return list of tree sales', async () => {
        Common.addTreeWithPlanter(treeInstance, ownerAccount, deployerAccount);

        let price = Units.convert('0.01', 'eth', 'wei');
        let treeId = 0;


        await treeSaleInstance.addToSalesList(
            treeId,
            price,
            { from: ownerAccount });

        return await treeSaleInstance.getSaleData(0)
            .then((saleData) => {

                assert.equal(
                    treeId,
                    saleData[0].toString(),
                    "First tree id is: " + saleData[0].toString()
                );

                assert.equal(
                    price,
                    saleData[1].toString(),
                    "First tree sale price is: " + saleData[1].toString()
                );
            }).catch((error) => {
                console.log(error);
            });
    });



});