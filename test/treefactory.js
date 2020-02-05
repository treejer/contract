const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');


contract('TreeFactory', (accounts) => {
    let treeInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];

    beforeEach(async () => {
        treeInstance = await TreeFactory.new({ from: deployerAccount });
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

        return treeInstance.add(
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


    it("should add tree", async () => {
        let name = 'firstTree';

        let tx = await addTree(name);
        truffleAssert.eventEmitted(tx, 'NewTreeAdded', (ev) => {
            return ev.id.toString() === '0' && ev.name === name;
        });

    });

    it("should return owner tree count", async () => {

        addTree();
        addTree();

        return await treeInstance.ownerTreesCount({ from: ownerAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Owner tree counts are: " + count.toString()
                );
            });
    });


    it("should return tree owner", async () => {

        addTree();

        return await treeInstance.treeOwner(0, { from: ownerAccount })
            .then(ownerAddress => {
                assert.equal(
                    ownerAccount,
                    ownerAddress,
                    "Tree owner is: " + ownerAddress
                );
            });
    });




});