const AccessRestriction = artifacts.require("AccessRestriction");
const TreeFactory = artifacts.require("TreeFactory");
const GBFactory = artifacts.require("GBFactory");
const UpdateFactory = artifacts.require("UpdateFactory");
const Tree = artifacts.require("Tree");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');
const Common = require('./common');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');


contract('TreeFactory', (accounts) => {
    let arInstance;
    let treeInstance;
    let treeTokenInstance;
    let gbInstance;
    let updateInstance;

    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const secondAccount = accounts[2];
    const planterAccount = accounts[3];
    const adminAccount = accounts[5];
    const ambassadorAccount = accounts[6];
    const admin2Account = accounts[7];
    const withdrawLocalDevelopmentFundAccount = accounts[3];
    const withdrawRescueFundAccount = accounts[5];
    const withdrawResearchFundAccount = accounts[8];

    const zeroAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], { initializer: 'initialize', unsafeAllowCustomTypes: true, from: deployerAccount });
        updateInstance = await deployProxy(UpdateFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeInstance = await deployProxy(TreeFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        gbInstance = await deployProxy(GBFactory, [arInstance.address], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });
        treeTokenInstance = await deployProxy(Tree, [arInstance.address, ''], { initializer: 'initialize', from: deployerAccount, unsafeAllowCustomTypes: true });

        await treeInstance.setGBAddress(gbInstance.address, { from: deployerAccount });
        await treeInstance.setUpdateFactoryAddress(updateInstance.address, { from: deployerAccount });
        await treeInstance.setTreeTokenAddress(treeTokenInstance.address, { from: deployerAccount });

        await updateInstance.setTreeFactoryAddress(treeInstance.address, { from: deployerAccount });

        await Common.addTreeFactoryRole(arInstance, treeInstance.address, deployerAccount);

        

    });

    afterEach(async () => {
        // await treeInstance.kill({ from: ownerAccount });
    });

    it("get the size of the contract", function () {
        return TreeFactory.deployed().then(function (instance) {
            var bytecode = instance.constructor._json.bytecode;
            var deployed = instance.constructor._json.deployedBytecode;
            var sizeOfB = bytecode.length / 2;
            var sizeOfD = deployed.length / 2;
            console.log("size of bytecode in bytes = ", sizeOfB);
            console.log("size of deployed in bytes = ", sizeOfD);
            console.log("initialisation and constructor code in bytes = ", sizeOfB - sizeOfD);
        });
    });

    it("should add tree", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);

        let tx = await Common.addTree(treeInstance, ownerAccount);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0'
        });

    });



    it("should plant from funded trees", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount });

        await treeInstance.fund(2, { from: secondAccount, value: price * 2 });

        await Common.addPlanter(arInstance, planterAccount, deployerAccount);
        let tx = await Common.addTree(treeInstance, planterAccount);

        truffleAssert.eventEmitted(tx, 'TreePlanted', (ev) => {
            return ev.id.toString() === '0';
        });

    });

    it("should return owner tree count", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        return await treeTokenInstance.balanceOf(ownerAccount, { from: ownerAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Owner tree counts are: " + count.toString()
                );
            });
    });

    // it("should return owner trees", async () => {

    //     await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
    //     await Common.addTree(treeInstance, ownerAccount);

    //     await Common.addPlanter(arInstance, secondAccount, deployerAccount);
    //     await Common.addTree(treeInstance, secondAccount);

    //     await Common.addTree(treeInstance, ownerAccount);

    //     return await treeInstance.getOwnerTrees(ownerAccount, { from: ownerAccount })
    //         .then(ownerTrees => {

    //             assert.equal(
    //                 ownerTrees[0],
    //                 0,
    //                 "First tree id must 0" 
    //             );

    //             assert.equal(
    //                 ownerTrees[1],
    //                 2,
    //                 "second tree id must 2"
    //             );
    //         });
    // });


    it("should return tree owner", async () => {

        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        return await treeTokenInstance.ownerOf(0, { from: ownerAccount })
            .then(ownerAddress => {
                assert.equal(
                    ownerAccount,
                    ownerAddress,
                    "Tree owner is: " + ownerAddress
                );
            });
    });

    it("should update tree price", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.02', 'eth', 'wei');
        let tx = await treeInstance.setPrice(price, { from: adminAccount })

        truffleAssert.eventEmitted(tx, 'PriceChanged', (ev) => {
            return ev.price.toString() === price;
        });

    });

    it("should return tree price", async () => {

        Common.addAdmin(arInstance, adminAccount, deployerAccount);

        let price = Units.convert('0.03', 'eth', 'wei');
        await treeInstance.setPrice(price, { from: adminAccount })

        return await treeInstance.price({ from: ownerAccount })
            .then(treePrice => {
                assert.equal(
                    treePrice,
                    price,
                    "Price: " + treePrice
                );
            });
    });

    it("should return tree data", async () => {


        await Common.addPlanter(arInstance, ownerAccount, deployerAccount);
        await Common.addTree(treeInstance, ownerAccount);

        return await treeInstance.trees(0, { from: ownerAccount })
            .then(tree => {
                assert.notEqual(
                    tree[0],
                    'not longitude'
                );
            });
    });

    it("should fund a tree from planted trees", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        await Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        await Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
        await Common.addPlanter(arInstance, planterAccount, deployerAccount);

        await Common.addGB(gbInstance, ambassadorAccount, [planterAccount], 'firstGb');

        await Common.addTree(treeInstance, planterAccount);

        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {

            if (ev.treeId.toString() === '0') {
                return ev.treeId.toString() === '0' && ev.planterBalance.toString() === (balance.toString() * 4500 / 10000).toString();
            } else {
                return ev.treeId.toString() === '1' && ev.planterBalance.toString() === (balance.toString() * 4000 / 10000).toString();
            }
        });

    });


    it("should fund a tree", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })


        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        truffleAssert.eventEmitted(tx, 'TreeFunded', (ev) => {
            return ev.treeId.toString() === '0' && ev.planterBalance.toString() === (balance.toString() * 4000 / 10000).toString();
        });

    });


    it("should update balance of wallets", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: adminAccount })

        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });

        await treeInstance.treejerFund()
            .then((_treejerFund) => {

                assert.equal(
                    _treejerFund.toString(),
                    (balance.toString() * 2500 / 10000 * 2).toString(),
                    "treejerFund " + _treejerFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

        await treeInstance.plantersFund()
            .then((_plantersFund) => {
                assert.equal(
                    _plantersFund.toString(),
                    (balance.toString() * 4000 / 10000 * 2).toString(),
                    "plantersFund " + _plantersFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

        await treeInstance.ambassadorsFund()
            .then((_ambassadorsFund) => {
                assert.equal(
                    _ambassadorsFund.toString(),
                    '0',
                    "ambassadorsFund " + _ambassadorsFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

        await treeInstance.localDevelopmentFund()
            .then((_localDevelopmentFund) => {
                assert.equal(
                    _localDevelopmentFund.toString(),
                    (balance.toString() * 1500 / 10000 * 2).toString(),
                    "localDevelopmentFund " + _localDevelopmentFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

        await treeInstance.rescueFund()
            .then((_rescueFund) => {
                assert.equal(
                    _rescueFund.toString(),
                    (balance.toString() * 1000 / 10000 * 2).toString(),
                    "rescueFund " + _rescueFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });

        await treeInstance.researchFund()
            .then((_researchFund) => {
                assert.equal(
                    _researchFund.toString(),
                    (balance.toString() * 500 / 10000 * 2).toString(),
                    "researchFund " + _researchFund.toString() + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });



    });





    it("should withdraw treejer, localDevelopmentFund,  rescueFund, researchFund", async () => {

        let price = Units.convert('0.02', 'eth', 'wei');
        let count = 2;
        let balance = price / count;

        Common.addAdmin(arInstance, adminAccount, deployerAccount);
        let treePrice = Units.convert('0.01', 'eth', 'wei');
        await treeInstance.setPrice(treePrice, { from: deployerAccount })


        let tx = await treeInstance.fund(count,
            { from: secondAccount, value: price });



        treejer_amount = (parseInt(balance) * 2500 / 10000 * 2).toString();
        local_amount = (parseInt(balance) * 1500 / 10000 * 2).toString();
        rescue_amount = (parseInt(balance) * 1000 / 10000 * 2).toString();
        research_amount = (parseInt(balance) * 500 / 10000 * 2).toString();


        let beforeWithdraw = await web3.eth.getBalance(admin2Account);

        await treeInstance.withdrawTreejerFund(admin2Account, treejer_amount,
            { from: deployerAccount });


        let beforeWithdrawLocal = await web3.eth.getBalance(withdrawLocalDevelopmentFundAccount);

        await treeInstance.withdrawLocalDevelopmentFund(withdrawLocalDevelopmentFundAccount, local_amount,
            { from: deployerAccount });

        let beforeWithdrawRescue = await web3.eth.getBalance(withdrawRescueFundAccount);

        await treeInstance.withdrawRescueFund(withdrawRescueFundAccount, rescue_amount,
            { from: deployerAccount });

        let beforeWithdrawResearch = await web3.eth.getBalance(withdrawResearchFundAccount);


        await treeInstance.withdrawResearchFund(withdrawResearchFundAccount, research_amount,
            { from: deployerAccount });

        await web3.eth.getBalance(admin2Account)
            .then((balanceEther) => {

                assert.equal(
                    balanceEther.toString(),
                    (parseInt(beforeWithdraw) + parseInt(treejer_amount)).toString(),
                    "Ether admin2Account balance: " + balanceEther.toString() + " returned"
                );

            }).catch((error) => {
                console.log(error);
            });

        await web3.eth.getBalance(withdrawLocalDevelopmentFundAccount)
            .then((balanceEther) => {

                assert.equal(
                    balanceEther.toString(),
                    (parseInt(beforeWithdrawLocal) + parseInt(local_amount)).toString(),
                    "Ether withdrawLocalDevelopmentFundAccount balance: " + balanceEther.toString() + " returned"
                );

            }).catch((error) => {
                console.log(error);
            });

        await web3.eth.getBalance(withdrawRescueFundAccount)
            .then((balanceEther) => {

                assert.equal(
                    balanceEther.toString(),
                    (parseInt(beforeWithdrawRescue) + parseInt(rescue_amount)).toString(),
                    "Ether withdrawRescueFundAccount balance: " + balanceEther.toString() + " returned"
                );

            }).catch((error) => {
                console.log(error);
            });

        await web3.eth.getBalance(withdrawResearchFundAccount)
            .then((balanceEther) => {

                assert.equal(
                    balanceEther.toString(),
                    (parseInt(beforeWithdrawResearch) + parseInt(research_amount)).toString(),
                    "Ether withdrawResearchFundAccount balance: " + balanceEther.toString() + " returned"
                );

            }).catch((error) => {
                console.log(error);
            });


    });


        it("should withdraw planter fund", async () => {

            let price = Units.convert('0.02', 'eth', 'wei');
            let count = 2;
            let balance = price / count;

            Common.addAdmin(arInstance, adminAccount, deployerAccount);
            let treePrice = Units.convert('0.01', 'eth', 'wei');
            await treeInstance.setPrice(treePrice, { from: adminAccount })


            Common.addPlanter(arInstance, planterAccount, deployerAccount);

            Common.addTree(treeInstance, planterAccount, 'first');
            Common.addTree(treeInstance, planterAccount, 'second');

            await Common.sleep(1000);

            Common.addUpdate(updateInstance, planterAccount, 0);
            Common.acceptUpdate(updateInstance, deployerAccount, 0);

            Common.addUpdate(updateInstance, planterAccount, 1);
            Common.acceptUpdate(updateInstance, deployerAccount, 1);

            await treeInstance.fund(count,
                { from: secondAccount, value: price });


            let tx = await treeInstance.withdrawPlanterBalance({ from: planterAccount });

            truffleAssert.eventEmitted(tx, 'PlanterBalanceWithdrawn', (ev) => {
                return ev.amount.toString() === '84559444' && ev.planter === planterAccount;
            });

        });

        it("should withdraw ambassador fund", async () => {

            let price = Units.convert('0.03', 'eth', 'wei');
            let count = 3;
            let balance = price / count;

            Common.addAdmin(arInstance, adminAccount, deployerAccount);
            let treePrice = Units.convert('0.01', 'eth', 'wei');
            await treeInstance.setPrice(treePrice, { from: adminAccount })

            Common.addAmbassador(arInstance, ambassadorAccount, deployerAccount);
            Common.addPlanter(arInstance, planterAccount, deployerAccount);

            Common.addGB(gbInstance, ambassadorAccount, [planterAccount], 'GB GB');

            Common.addTree(treeInstance, planterAccount, 'first');

            //with two update
            Common.addTree(treeInstance, planterAccount, 'second');

            // without update
            Common.addTree(treeInstance, planterAccount, 'three');

            await Common.sleep(1000);

            Common.addUpdate(updateInstance, planterAccount, 0);
            Common.acceptUpdate(updateInstance, deployerAccount, 0);

            Common.addUpdate(updateInstance, planterAccount, 1);
            Common.acceptUpdate(updateInstance, deployerAccount, 1);

            await Common.sleep(1000);

            Common.addUpdate(updateInstance, planterAccount, 1);
            Common.acceptUpdate(updateInstance, deployerAccount, 2);


            await treeInstance.fund(count,
                { from: secondAccount, value: price });

            let tx = await treeInstance.withdrawAmbassadorBalance({ from: ambassadorAccount });

            truffleAssert.eventEmitted(tx, 'AmbassadorBalanceWithdrawn', (ev) => {
                return ev.amount.toString() === '15854895' && ev.ambassador === ambassadorAccount;
            });

        });


});