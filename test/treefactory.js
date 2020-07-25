const TreeFactory = artifacts.require("TreeFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');


const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';


contract('TreeFactory', (accounts) => {
    let treeInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const adminAccount = accounts[5];

    beforeEach(async () => {
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

        return await treeInstance.ownerTreesCount(ownerAccount, { from: ownerAccount })
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

    it("should update tree price", async () => {

        treeInstance.grantRole(DEFAULT_ADMIN_ROLE, adminAccount, { from: deployerAccount });


        let name = 'firstTree';

        await addTree(name);

        let price = Units.convert('0.02', 'eth', 'wei');
        let tx = await treeInstance.setPrice(price, { from: adminAccount })

        truffleAssert.eventEmitted(tx, 'PriceChanged', (ev) => {
            return ev.price.toString() === price;
        });

    });

    it("should return tree price", async () => {

        treeInstance.grantRole(DEFAULT_ADMIN_ROLE, adminAccount, { from: deployerAccount });


        let name = 'firstTree';

        await addTree(name);

        let price = Units.convert('0.03', 'eth', 'wei');
        let tx = await treeInstance.setPrice(price, { from: adminAccount })


        return await treeInstance.getPrice({ from: ownerAccount })
            .then(treePrice => {
                assert.equal(
                    treePrice,
                    price,
                    "Price: " + treePrice
                );
            });
    });


});