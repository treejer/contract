const TreeType = artifacts.require("TreeType");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


contract('TreeType', (accounts) => {
    let treeTypeInstance;
    const ownerAccount = accounts[0];

    beforeEach(async () => {
        treeTypeInstance = await TreeType.new({from: ownerAccount});
    });

    afterEach(async () => {
        // await treetype.kill({ from: ownerAccount });
    });

    it("should create tree type", async () => {
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 100;
        let price = Units.convert('0.01', 'eth', 'wei');


        let tx = await treeTypeInstance.create(name, scientificName, o2formula, price, {from: ownerAccount});

        truffleAssert.eventEmitted(tx, 'NewType', (ev) => {
            return ev.typeId.toString() === '0' && ev.name === name && ev.O2Formula.toString() === o2formula.toString();
        });

    });

    it('should return tree type', async () => {

        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 100;
        let price = Units.convert('0.01', 'eth', 'wei');

        await treeTypeInstance.create(name, scientificName, o2formula, price, {from: ownerAccount});

        return await treeTypeInstance.get(id)
            .then((treeType) => {
                assert.equal(
                    treeType[0],
                    name,
                    "Tree with id: " + id + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });
    });


    it('should return o2Formula ', async () => {

        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 100;
        let price = Units.convert('0.01', 'eth', 'wei');

        await treeTypeInstance.create(name, scientificName, o2formula, price, { from: ownerAccount });

        return await treeTypeInstance.getO2Formula(id)
            .then((treeTypeO2formula) => {
                assert.equal(
                    treeTypeO2formula,
                    o2formula,
                    "Tree o2formula : " + treeTypeO2formula + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });
    });


    it('should return count of tree types', async () => {

        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 100;
                let price = Units.convert('0.01', 'eth', 'wei');



        let id1 = 1;
        let name1 = 'konar';
        let scientificName1 = 'knr';
        let o2formula1 = 100;
                let price1 = Units.convert('0.02', 'eth', 'wei');


        await treeTypeInstance.create(name, scientificName, o2formula, price, {from: ownerAccount});
        await treeTypeInstance.create(name1, scientificName1, o2formula1, price1, {from: ownerAccount});

        return await treeTypeInstance.count()
            .then((count) => {
                assert.equal(
                    2,
                    count,
                    "Tree types count is: " + count
                );
            }).catch((error) => {
                console.log(error);
            });
    });

});