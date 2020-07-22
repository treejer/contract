const TreeFactory = artifacts.require("TreeFactory");
const TreeSale = artifacts.require("TreeSale");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


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

    function addTree(name = null) {
        let typeId = 0;
        let gbId = 0;
        name = name !== null ? name : 'firstTree';
        let latitude = '38.0962';
        let longitude = '46.2738';
        let plantedDate = '2020/02/20';
        let birthDate = '2020/02/20';
        let height = '1';
        let diameter = '1';

        return treeInstance.add(
            typeId,
            gbId,
            [
                name,
                latitude,
                longitude,
                plantedDate,
                birthDate
            ],
            [
                height,
                diameter,
            ],
            { from: ownerAccount });
    }

    it("should add to tree sales list", async () => {

        addTree('firstTree');
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

        addTree('firstTree');
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
        addTree('firstTree');
        addTree('secondTree');

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
        addTree('firstTree');
        addTree('secondTree');
        addTree('thirdTree');

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
        addTree('firstTree');

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