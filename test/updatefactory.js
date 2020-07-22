const UpdateFactory = artifacts.require("UpdateFactory");
const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


contract('UpdateFactory', (accounts) => {
    let updateInstance;
    let treeInstance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];

    beforeEach(async () => {
        updateInstance = await UpdateFactory.new({ from: deployerAccount });
        treeInstance = await TreeFactory.new({ from: deployerAccount });

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

    it("should add updates", async () => {

        addTree('firstTree');
        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'UpdateAdded', (ev) => {
            return ev.updateId.toString() === '0' && ev.treeId.toString() === treeId.toString() && ev.imageHash.toString() === imageHash.toString();
        });

    });


    it("should accept update", async () => {

        addTree('firstTree');
        let treeId = 0;
        let imageHash = '0x14dsahjdauhdiw012564';

        let tx = await updateInstance.post(treeId, imageHash, { from: ownerAccount });


        let tx1 = await updateInstance.acceptUpdate(0, { from: ownerAccount });


        truffleAssert.eventEmitted(tx1, 'UpdateAccepted', (ev) => {
            return ev.updateId.toString() === '0';
        });

    });



});