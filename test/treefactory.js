const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');


contract('TreeFactory', (accounts) => {
    let treeInstance;
    const ownerAccount = accounts[0];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({from: ownerAccount});
    });

    afterEach(async () => {
        // await treetype.kill({ from: ownerAccount });
    });

    it("should add tree", async () => {

        let typeId = 0;
        let name = 'firstTree';
        let latitude = '38.0962';
        let longitude = '46.2738';
        let plantedDate = '2020/02/20';
        let birthDate = '2020/02/20';
        let height = '1';
        let diameter = '1';

        let tx = await treeInstance.add(
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
            {from: ownerAccount});

        truffleAssert.eventEmitted(tx, 'NewTreeAdded', (ev) => {
            return ev.id.words[0] === 0 && ev.name === name;
        });

    });

});