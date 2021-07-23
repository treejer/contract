const AccessRestriction = artifacts.require("AccessRestriction.sol");
const IncrementalSell = artifacts.require("IncrementalSell.sol");
const GenesisTree = artifacts.require("GenesisTree.sol");
const TreeAttribute = artifacts.require("TreeAttribute.sol");
const Tree = artifacts.require("Tree.sol");
const assert = require("chai").assert;
require("chai").use(require("chai-as-promised")).should();
const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const truffleAssert = require("truffle-assertions");
const Common = require("./common");

const {
    TimeEnumes,
    CommonErrorMsg,
    IncrementalSellErrorMsg,
    GenesisTreeErrorMsg,
    TreesuryManagerErrorMsg,
  } = require("./enumes");

  contract("IncrementalSell", (accounts) => {
    let iSellInstance;
    let arInstance;
    let genesisTreeInstance;
    let treeAttributeInstance;
    let startTime;
    let endTime;
  
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const userAccount1 = accounts[2];
    const userAccount2 = accounts[3];
    const userAccount3 = accounts[4];
    const userAccount4 = accounts[5];
    const userAccount5 = accounts[6];
    const userAccount6 = accounts[7];
    const userAccount7 = accounts[8];
    const treasuryAddress = accounts[9];
  
    const ipfsHash = "some ipfs hash here";

    beforeEach(async () => {
        arInstance = await deployProxy(AccessRestriction, [deployerAccount], {
          initializer: "initialize",
          unsafeAllowCustomTypes: true,
          from: deployerAccount,
        });
        iSellInstance = await deployProxy(IncrementalSell, [arInstance.address], {
            initializer: "initialize",
            from: deployerAccount,
            unsafeAllowCustomTypes: true,
        });
        genesisTreeInstance = await deployProxy(GenesisTree, [arInstance.address], {
            initializer: "initialize",
            from: deployerAccount,
            unsafeAllowCustomTypes: true,
        });
        treeAttributeInstance = await deployProxy(TreeAttribute, [arInstance.address], {
            initializer: "initialize",
            from: deployerAccount,
            unsafeAllowCustomTypes: true,
        });
        treeTokenInstance = await deployProxy(Tree, [arInstance.address, ""], {
          initializer: "initialize",
          from: deployerAccount,
          unsafeAllowCustomTypes: true,
        });
    
        await iSellInstance.setGenesisTreeAddress(
            genesisTreeInstance.address,
            {
              from: deployerAccount,
            }
        );

        await iSellInstance.setTreeAttributeAddress(
            treeAttributeInstance.address,
            {
              from: deployerAccount,
            }
        );
        await genesisTreeInstance.setTreeTokenAddress(treeTokenInstance.address, {
          from: deployerAccount,
        });
        await Common.addGenesisTreeRole(
          arInstance,
          genesisTreeInstance.address,
          deployerAccount
        );   
        await TreasuryInstance.addFundDistributionModel(
            3000,
            1200,
            1200,
            1200,
            1200,
            2200,
            0,
            0,
            {
              from: deployerAccount,
            }
          );
    
    }); 
    afterEach(async () => {});

    it("deploys successfully", async () => {
      const address = iSellInstance.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
    it("should set genesis tree address with admin access or fail otherwise", async () => {
      let tx = await iSellInstance.setGenesisTreeAddress(
        genesisTreeInstance.address,
        {
          from: deployerAccount,
        }
      );
      await iSellInstance
        .setTreeAttributeAddress(treeAttributeInstance.address, {
          from: userAccount2,
        })
        .should.be.rejectedWith(CommonErrorMsg.CHECK_ADMIN); //must be faild because ots not deployer account
    });

    it("added incrementalSell should has positive tree Count", async () => {

      await iSellInstance.addTreeSells(101,web3.utils.toWei("0.005"),0,100,400, {
          from: deployerAccount,
        }).should.be.rejectedWith(IncrementalSellErrorMsg.TREE_TO_SELL); //must be faild because treeCount is zero

    });

    it("added incrementalSell should has startTreeId>100", async () => {
      await iSellInstance.addTreeSells(101,web3.utils.toWei("0.005"),9900,100,400, {
          from: deployerAccount,
        });

        await iSellInstance.addTreeSells(98,web3.utils.toWei("0.005"),9900,100,400, {
          from: deployerAccount,
        }).should.be.rejectedWith(IncrementalSellErrorMsg.OCCUPIED_TREES); //treeStartId should be >100
    });

    it("added incrementalSell should has steps of price change>0", async () => {
        await iSellInstance.addTreeSells(101,web3.utils.toWei("0.005"),9900,0,400, {
          from: deployerAccount,
        }).should.be.rejectedWith(IncrementalSellErrorMsg.PRICE_CHANGE_PERIODS); // steps of price change should be >0
    });
    it("added incrementalSell should have equivalant fund distribution model", async () => {
        await TreasuryInstance.assignTreeFundDistributionModel(105, 10000, 0, {
            from: deployerAccount,
        });

        await iSellInstance.addTreeSells(101,web3.utils.toWei("0.005"),9900,0,400, {
          from: deployerAccount,
        }).should.be.rejectedWith(TreesuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
    });

    it("added incrementalSell should have equivalant fund distribution model", async () => {
        await TreasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
            from: deployerAccount,
        });

        await iSellInstance.addTreeSells(101,web3.utils.toWei("0.005"),9900,0,400, {
          from: deployerAccount,
        }).should.be.rejectedWith(TreesuryManagerErrorMsg.INVALID_ASSIGN_MODEL); // steps of price change should be >0
    });

    it("buyed Tree should be in incremental sell", async () => {
    await TreasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
        from: deployerAccount,
    });
      await iSellInstance.addTreeSells(101,web3.utils.toWei("0.01"),9900,100,1000, {
        from: deployerAccount,
      });
      await iSellInstance.buyTree(90,{value: web3.utils.toWei("1.15"),}).should.be.rejectedWith(IncrementalSellErrorMsg.INVALID_TREE);

    });

    it("low price paid for the tree", async () => {
      await TreasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
          from: deployerAccount,
      });
        await iSellInstance.addTreeSells(101,web3.utils.toWei("0.01"),9900,100,1000, {
          from: deployerAccount,
        });
        await iSellInstance.buyTree(110,{value: web3.utils.toWei("0.009"),from:userAccount3}).should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
  
      });

    it("check discount timeout", async () => {
        await TreasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
            from: deployerAccount,
        });
          await iSellInstance.addTreeSells(101,web3.utils.toWei("0.01"),9900,100,1000, {
            from: deployerAccount,
          });
          await iSellInstance.buyTree(110,{value: web3.utils.toWei("0.01"),from:userAccount3});
          await Common.travelTime(TimeEnumes.minutes, 7);
          await iSellInstance.buyTree(203,{value: web3.utils.toWei("0.0099"),from:userAccount3});
          await iSellInstance.buyTree(226,{value: web3.utils.toWei("0.011"),from:userAccount3});
          await Common.travelTime(TimeEnumes.minutes, 12);
          await iSellInstance.buyTree(292,{value: web3.utils.toWei("0.0099"),from:userAccount3}).should.be.rejectedWith(IncrementalSellErrorMsg.LOW_PRICE_PAID);
    
    });
    it("check discount usage", async () => {
      await TreasuryInstance.assignTreeFundDistributionModel(100, 10000, 0, {
          from: deployerAccount,
      });
        await iSellInstance.addTreeSells(101,web3.utils.toWei("0.01"),9900,100,1000, {
          from: deployerAccount,
        });
        await iSellInstance.buyTree(110,{value: web3.utils.toWei("0.009"),from:userAccount3});
  
  });


  });  





  


  

      