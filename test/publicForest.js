const AccessRestriction = artifacts.require("AccessRestriction");
const ForestFactory = artifacts.require("ForestFactory");
const TreeFactory = artifacts.require("TreeFactory");
// const PublicForest = artifacts.require("PublicForest");
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');



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


        let treePrice = Units.convert('0.02', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: deployerAccount });

        await forestInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });


    });

    afterEach(async () => {
        // await o1Instance.kill({ from: ownerAccount });
    });

    it("should fund public forest ", async () => {

        let name = 'BTC Forest';

        let tx = await forestInstance.createPublicForest(name, { from: deployerAccount })

        let pAddress = '';

        console.log(tx);

        truffleAssert.eventEmitted(tx, 'PublicForestCreated', (ev) => {
            
            // console.log(ev.forestAddress.toString());
            pAddress = ev.forestAddress.toString();

            console.log(pAddress);

            return ev.name.toString() === name.toString();
        });


        let value = Units.convert('0.01', 'eth', 'wei');

        console.log({ from: ownerAccount, to: pAddress, value: value });


        let txHash = await web3.eth.sendTransaction({ from: ownerAccount, to: pAddress, value: value });

        console.log(txHash);


        // truffleAssert.eventEmitted(txHash, 'ContributionReceived', (ev) => {

        //     console.log(ev);
        //     // return ev.from.toString() === name.toString() && ev.value.toString() === value.toString();
        // });

    });


});