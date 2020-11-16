const AccessRestriction = artifacts.require("AccessRestriction");
const ForestFactory = artifacts.require("ForestFactory");
const TreeFactory = artifacts.require("TreeFactory");
const PublicForest = artifacts.require("PublicForest");
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Common = require("./common");



contract('PublicForest', (accounts) => {
    let arInstance;
    let forestInstance;
    let treeInstance;
    // let publicForestInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];

    beforeEach(async () => {
    
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        forestInstance = await deployProxy(ForestFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount });
        // publicForestInstance = await deployProxy(PublicForest, [treeInstance.address, 'Treejer'], { initializer: 'initialize', from: deployerAccount });
        await forestInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });


        let treePrice = Units.convert('0.02', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: deployerAccount });



    });

    afterEach(async () => {
        // await o1Instance.kill({ from: ownerAccount });
    });

    it("should donate and fund public forest ", async () => {

        let tx = await forestInstance.createPublicForest({ from: deployerAccount })

        let pAddress = '';

        truffleAssert.eventEmitted(tx, 'PublicForestCreated', (ev) => {
            pAddress = ev.forestAddress.toString();
            return pAddress != null;
        });

        let value = Units.convert('0.04', 'eth', 'wei');

        publicForestInstance = await PublicForest.at(pAddress);

        let txa = await publicForestInstance.donate({ from: deployerAccount, value: value });

        // truffleAssert.eventEmitted(txa, 'ContributionReceived', (ev) => {

        //     console.log(ev.from.toString(), ownerAccount, ev.value.toString(), value.toString());
        //     return ev.from.toString() === ownerAccount && ev.value.toString() === value.toString();
        // });

        truffleAssert.eventEmitted(txa, 'TreesAddedToForest', (ev) => {
            return ev.count.toString() === '2';
        });

    });


    


});