const AccessRestriction = artifacts.require("AccessRestriction");
const ForestFactory = artifacts.require("ForestFactory");
const TreeFactory = artifacts.require("TreeFactory");
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const Dai = artifacts.require("Dai");



contract('ForestFactory', (accounts) => {
    let arInstance;
    let forestInstance;
    let treeInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];

    beforeEach(async () => {
    
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        forestInstance = await deployProxy(ForestFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount });
        daiContract = await Dai.new(Units.convert('1000000', 'eth', 'wei'), { from: deployerAccount });


        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: deployerAccount });


        await forestInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });
        await forestInstance.setDaiTokenAddress(daiContract.address, { from: deployerAccount });


    });

    afterEach(async () => {
    });

    it("should create public forest", async () => {

        let tx = await forestInstance.createPublicForest({ from: deployerAccount })

        truffleAssert.eventEmitted(tx, 'PublicForestCreated', (ev) => {
            return ev.forestAddress.toString() !== null;
        });

    });


});