const TreeType = artifacts.require("TreeType");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');



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
        let o2formula = 100;

        let tx = await Common.addType(treeTypeInstance, ownerAccount, name);

        truffleAssert.eventEmitted(tx, 'NewType', (ev) => {
            return ev.typeId.toString() === '0' && ev.name === name && ev.O2Formula.toString() === o2formula.toString();
        });

    });

    it('should return tree type', async () => {

        let id = 0;
        let name = 'balut';

        await Common.addType(treeTypeInstance, ownerAccount, name);

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
        let o2formula = 100;

        await Common.addType(treeTypeInstance, ownerAccount, name);

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

        let name = 'balut';
        let name1 = 'konar';


        await Common.addType(treeTypeInstance, ownerAccount, name);
        await Common.addType(treeTypeInstance, ownerAccount, name1);

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