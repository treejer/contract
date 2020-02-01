const TreeType = artifacts.require("TreeType");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');


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
        let o2formula = 'hajm*ertefa';

        let tx = await treeTypeInstance.create(name, scientificName, o2formula, {from: ownerAccount});

        truffleAssert.eventEmitted(tx, 'NewType', (ev) => {
            return ev.typeId.words[0] === 0 && ev.name === name && ev.O2Formula === o2formula;
        });

    });

    it('should return tree type', async () => {

        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 'hajm*ertefa';

        await treeTypeInstance.create(name, scientificName, o2formula, {from: ownerAccount});

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


    it('should return count of tree types', async () => {

        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 'hajm*ertefa';


        let id1 = 1;
        let name1 = 'konar';
        let scientificName1 = 'knr';
        let o2formula1 = 'hajm*ertefa';

        await treeTypeInstance.create(name, scientificName, o2formula, {from: ownerAccount});
        await treeTypeInstance.create(name1, scientificName1, o2formula1, {from: ownerAccount});

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