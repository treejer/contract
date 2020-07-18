const O2Factory = artifacts.require("O2Factory");
const GBFactory = artifacts.require("GBFactory");
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const Units = require('ethereumjs-units');



contract('O2Factory', (accounts) => {
    let o2Instance;
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
        o2Instance = await O2Factory.new({ from: deployerAccount });
        gbInstance = await GBFactory.new({ from: deployerAccount });
    });

    afterEach(async () => {
        // await o2Instance.kill({ from: ownerAccount });
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function addGB(title = null) {
        title = title !== null ? title : 'firstO2';
        let coordinates = [
          {lat: 25.774, lng: -80.190},
          {lat: 18.466, lng: -66.118},
          {lat: 32.321, lng: -64.757},
          {lat: 25.774, lng: -80.190}
        ];


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

    function addType(name = null) {
        name = name !== null ? name : 'balut';
        let scientificName = 'blt';
        let o2formula = 100;
        let price = Units.convert('0.01', 'eth', 'wei');


        o2Instance.create(name, scientificName, o2formula, price, { from: ownerAccount });
    }

    async function addTree(name = null) {
        let typeId = 0;
        let gbId = 0;
        name = name !== null ? name : 'firstTree';
        let latitude = '38.0962';
        let longitude = '46.2738';
        let plantedDate = '2020/02/20';
        let birthDate = '2020/02/20';
        let height = '1';
        let diameter = '1';


        addType();

        o2Instance.add(
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

        await sleep(1000);


        o2Instance.post(0, 'imageHash', { from: ownerAccount });
        o2Instance.acceptUpdate(0, { from: ownerAccount });
    }


    it("should add o2", async () => {
        let title = 'firstGB';
        let titleTree = 'firstTree';

        await addGB(title);
        await addTree(titleTree);

        let tx = await o2Instance.mint({ from: ownerAccount });

        truffleAssert.eventEmitted(tx, 'O2Minted', (ev) => {
            return ev.owner.toString() === ownerAccount;
        });
        
        // truffleAssert.eventEmitted(tx, 'NewGBAdded', (ev) => {
        //     return ev.id.toString() === '0' && ev.title === title;
        // });

    });

    
    // it("should return ambassodar o2 count", async () => {

    //     addGB();
    //     addGB('second db 2');

    //     return await o2Instance.getAmbassadorO2Count({ from: ambassadorAccount })
    //         .then(count => {
    //             assert.equal(
    //                 2,
    //                 count.toString(),
    //                 "Ambassodar o2 counts are: " + count.toString()
    //             );
    //         });
    // });


    // it("should return o2 ambassador", async () => {

    //     addGB();

    //     return await o2Instance.getO2Ambassador(0, { from: ambassadorAccount })
    //         .then(ambassadorAddress => {
    //             assert.equal(
    //                 ambassadorAccount,
    //                 ambassadorAddress,
    //                 "O2 ambassador is: " + ambassadorAddress
    //             );
    //         });
    // });

    // it('should return greenblock', async () => {
    //     let title = 'firsO2';
    //     let id = 0;   
    //     addGB(title);

    //     return await o2Instance.getO2(id)
    //         .then((greenBlock) => {
    //             assert.equal(
    //                 greenBlock[0],
    //                 title,
    //                 "O2 with id: " + id + " returned"
    //             );
    //         }).catch((error) => {
    //             console.log(error);
    //         });
    // });




});