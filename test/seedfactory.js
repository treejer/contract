const AccessRestriction = artifacts.require("AccessRestriction");
const SeedFactory = artifacts.require("SeedFactory");
const GBFactory = artifacts.require("GBFactory");
const TreeType = artifacts.require("TreeType");
const TreeFactory = artifacts.require("TreeFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const Tree = artifacts.require("Tree");
const Seed = artifacts.require("Seed");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require("./common");
const { deployProxy } = require('@openzeppelin/truffle-upgrades');



contract('SeedFactory', (accounts) => {
    let arInstance;
    let seedInstance;
    let gbInstance;
    let treeInstance;
    let updateInstance;
    let treeTokenInstance;
    let seedTokenInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const ambassadorAccount = accounts[2];
    const planter1Account = accounts[3];
    const planter2Account = accounts[4];
    const planter3Account = accounts[5];
    const planter4Account = accounts[6];
    const planter5Account = accounts[7];
    const adminAccount = accounts[7];

    beforeEach(async () => {
    
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        treeTokenInstance = await deployProxy(Tree, [arInstance.address, ''], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        seedTokenInstance = await deployProxy(Seed, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });


        await treeInstance.setGBFactoryAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });
        await treeInstance.setTreeTokenAddress(treeTokenInstance.address, { from: deployerAccount });



        seedInstance = await deployProxy(SeedFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount });

        await seedInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
        await seedInstance.setTreeTokenAddress(treeTokenInstance.address, { from: deployerAccount });
        await seedInstance.setSeedTokenAddress(seedTokenInstance.address, { from: deployerAccount });


        await Common.addTreeFactoryRole(arInstance, treeInstance.address, deployerAccount);
        await Common.addSeedFactoryRole(arInstance, seedInstance.address, deployerAccount);
    });

    afterEach(async () => {
        // await seedInstance.kill({ from: ownerAccount });
    });

    async function fundTree() {
        await seedInstance.setSeedGeneratedPerSecond(1, { from: deployerAccount });
        await Common.fundTree(treeInstance, ownerAccount, 2);
    }

    it("should mint seed", async () => {

        fundTree();

        await Common.sleep(1000);

        let tx = await seedInstance.mint({ from: ownerAccount })

        truffleAssert.eventEmitted(tx, 'SeedMinted', (ev) => {
            return ev.owner.toString() === ownerAccount && ev.totalSeed.toString() === '2';
        });

    });


    it('should return balance of owner', async () => {

        fundTree();

        await Common.sleep(1000);

        await seedInstance.mint({ from: ownerAccount })

        return await seedTokenInstance.balanceOf(ownerAccount, { from: ownerAccount })
            .then((balance) => {
                assert.equal(
                    '2',
                    balance,
                    "Balance of owner: " + balance
                );
            }).catch((error) => {
                console.log(error);
            });
    });


    it('should return tree generated Seed', async () => {

        fundTree();

        await Common.sleep(2000);

        await Common.fundTree(treeInstance, ownerAccount, 1);


        return await seedInstance.calculateTreeGeneratedSeed(0, { from: ownerAccount })
            .then((seedGenerated) => {
                assert.equal(
                    '2',
                    seedGenerated,
                    "Tree generated Seed: " + seedGenerated
                );
            }).catch((error) => {
                console.log(error);
            });
    });


    //@todo shpoud check for last minign date


});