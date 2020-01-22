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
            return ev.typeId == '0' && ev.name === name && ev.O2Formula === o2formula;
        });

    });

    it('should return tree type', () => {
        let id = 0;
        let name = 'balut';
        let scientificName = 'blt';
        let o2formula = 'hajm*ertefa';

        let tx = treeTypeInstance.create(name, scientificName, o2formula, {from: ownerAccount});


        console.log(treeTypeInstance.getTreeType.call(id));

        return treeTypeInstance.getTreeType(id)
            .then((treeType) => {


                console.log(treeType);

                assert.equal(
                    treeType.typeId,
                    id,
                    "Tree with id: " + treeType.typeId + " returned"
                );
            });
    });

    // it("should return tree type", async () => {
    //     let id = 0;
    //     let name = 'balut';
    //     let scientificName = 'blt';
    //     let o2formula = 'hajm*ertefa';
    //
    //
    //     await treeTypeInstance.create(name, scientificName, o2formula, {from: ownerAccount})
    //         .then(async () => {
    //             let treeType = await treeTypeInstance.get(id);
    //
    //
    //             // await debug( treeType);
    //
    //             // console.log(treeType);
    //
    //             assert.equal(
    //                 treeType.typeId,
    //                 id,
    //                 "Tree with id: "+ treeType.typeId + " returned"
    //             );
    //         });
    // });

});