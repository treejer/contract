const GBFactory = artifacts.require("GBFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');


const AMBASSADOR_ROLE = web3.utils.soliditySha3('AMBASSADOR_ROLE');

contract('GBFactory', (accounts) => {
    let gbInstance;
    const ownerAccount = accounts[0];
    const deployerAccount = accounts[1];
    const ambassadorAccount = accounts[2];
    const planter1Account = accounts[3];
    const planter2Account = accounts[4];
    const planter3Account = accounts[5];
    const planter4Account = accounts[6];
    const planter5Account = accounts[7];

    beforeEach(async () => {
        gbInstance = await GBFactory.new({ from: deployerAccount });
    });

    afterEach(async () => {
        // await gbInstance.kill({ from: ownerAccount });
    });

    function addAmbassador() {
        gbInstance.grantRole(AMBASSADOR_ROLE, ambassadorAccount,{ from: deployerAccount });
    }

    function addGB(title = null) {
        title = title !== null ? title : 'firstGB';
        let coordinates = [
          {lat: 25.774, lng: -80.190},
          {lat: 18.466, lng: -66.118},
          {lat: 32.321, lng: -64.757},
          {lat: 25.774, lng: -80.190}
        ];

        addAmbassador();
        
        return gbInstance.add(
            title,
            JSON.stringify(coordinates),
            ambassadorAccount,
            [
                planter1Account,
                planter2Account,
                planter3Account,
                planter4Account,
                planter5Account
            ],
            { from: ambassadorAccount });
    }


    it("should add gb", async () => {
        let title = 'firstGB';

        let tx = await addGB(title);
        
        truffleAssert.eventEmitted(tx, 'NewGBAdded', (ev) => {
            return ev.id.toString() === '0' && ev.title === title;
        });

    });

    it("should return ambassodar gb count", async () => {

        addGB();
        addGB('second db 2');

        return await gbInstance.getAmbassadorGBCount({ from: ambassadorAccount })
            .then(count => {
                assert.equal(
                    2,
                    count.toString(),
                    "Ambassodar gb counts are: " + count.toString()
                );
            });
    });


    it("should return gb ambassador", async () => {

        addGB();

        return await gbInstance.getGBAmbassador(0, { from: ambassadorAccount })
            .then(ambassadorAddress => {
                assert.equal(
                    ambassadorAccount,
                    ambassadorAddress,
                    "GB ambassador is: " + ambassadorAddress
                );
            });
    });

    it('should return greenblock', async () => {
        let title = 'firsGB';
        let id = 0;   
        addGB(title);

        return await gbInstance.getGB(id)
            .then((greenBlock) => {
                assert.equal(
                    greenBlock[0],
                    title,
                    "GB with id: " + id + " returned"
                );
            }).catch((error) => {
                console.log(error);
            });
    });




});