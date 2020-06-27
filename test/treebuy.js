const Fund = artifacts.require("Fund");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


contract('Fund', (accounts) => {
    let instance;

    const deployerAccount = accounts[0];
    const ownerAccount = accounts[1];
    const secondAccount = accounts[2];

    beforeEach(async () => {
        instance = await Fund.new({ from: deployerAccount });
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

        let tx = instance.add(
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

        // let treeId = 0;
        // truffleAssert.eventEmitted(tx, 'NewTreeAdded', (ev) => {
        //     treeId =  ev.id.toString();
        //     return true;
        // });

        let price = Units.convert('0.01', 'eth', 'wei');
        return instance.addToSalesList(
            0,
            price,
            { from: ownerAccount });

        // return treeId
    }

    it("should buy a tree", async () => {

        addTree('firstTree');
        let price = Units.convert('0.01', 'eth', 'wei');


        let tx = await instance.buy(0,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeBought', (ev) => {
            return ev.saleId.toString() === '0' && ev.treeId.toString() === '0' && ev.price.toString() === price.toString() && ev.newOwner.toString() === secondAccount.toString();
        });

    });


    it("should fund a tree", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        let tx = await instance.fund(price,
            count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {
            return ev.treeId.toString() === '0' && ev.balance.toString() === balance.toString();
        });

    });

});