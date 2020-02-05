const TreeSale = artifacts.require("TreeSale");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


contract('TreeSale', (accounts) => {
    let treeSaleInstance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const secondAccount = accounts[2];

    beforeEach(async () => {
        treeSaleInstance = await TreeSale.new({ from: deployerAccount });
    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    function addTree(name = null) {
        let typeId = 0;
        name = name !== null ? name : 'firstTree';
        let latitude = '38.0962';
        let longitude = '46.2738';
        let plantedDate = '2020/02/20';
        let birthDate = '2020/02/20';
        let height = '1';
        let diameter = '1';

        return treeSaleInstance.add(
            typeId,
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
                    'Only owner of tree can add tree to sales list',
                    'add to list should throw an exception.'
                )
            });

    });



});