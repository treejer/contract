const Units = require('ethereumjs-units');

var Common = {};

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const AMBASSADOR_ROLE = web3.utils.soliditySha3('AMBASSADOR_ROLE');
const PLANTER_ROLE = web3.utils.soliditySha3('PLANTER_ROLE');

const SEED_FACTORY_ROLE = web3.utils.soliditySha3('SEED_FACTORY_ROLE');
const TREE_FACTORY_ROLE = web3.utils.soliditySha3('TREE_FACTORY_ROLE');
const O2_FACTORY_ROLE = web3.utils.soliditySha3('O2_FACTORY_ROLE');

Common.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Common.addType = async (instance, account, name = null) => {
    name = name !== null ? name : 'balut';
    let scientificName = 'blt';
    let o2formula = 100;
    let price = Units.convert('0.01', 'eth', 'wei');

    return await instance.create(name, scientificName, o2formula, price, { from: account });
}



Common.approveAndTransfer = async (instance, account, spender, from, amount = '1000') => {

    await instance
        .transfer(account, Units.convert(amount, 'eth', 'wei'),
            { from: from })

    await instance.approve(spender, Units.convert('999999999999999999999', 'eth', 'wei'), { from: account })
   
}


Common.addGB = async (instance, ambassadorAccount, planters, title = null) => {

    title = title !== null ? title : 'firstGB';
    let coordinates = [
        { lat: 25.774, lng: -80.190 },
        { lat: 18.466, lng: -66.118 },
        { lat: 32.321, lng: -64.757 },
        { lat: 25.774, lng: -80.190 }
    ];

    return await instance.create(
        title,
        JSON.stringify(coordinates),
        ambassadorAccount,
        planters,
        { from: ambassadorAccount });
}

Common.addTree = async (instance, account) => {

    let typeId = 0;
    let latitude = '38.0962';
    let longitude = '46.2738';
    let height = '1';
    let diameter = '1';

    return await instance.plant(
        typeId,
        [
            '',
            latitude,
            longitude
        ],
        [
            height,
            diameter,
        ],
        { from: account });
}

Common.fundTree = async (instance, ownerAccount, count) => {

    await instance.fund(count, { from: ownerAccount, value: 0 });
}

Common.addUpdate = async (instance, ownerAccount, treeId = 0) => {
    await instance.post(treeId, 'imageHash', { from: ownerAccount })
}

Common.acceptUpdate = async (instance, adminAccount, updateId = 0) => {
    await instance.acceptUpdate(updateId, { from: adminAccount });
}

Common.addAmbassador = async (instance, account, adminAccount) => {
    await instance.grantRole(AMBASSADOR_ROLE, account, { from: adminAccount });
}

Common.addPlanter = async (instance, account, adminAccount) => {
    await instance.grantRole(PLANTER_ROLE, account, { from: adminAccount });
}

Common.addAdmin = async (instance, account, adminAccount) => {
    await instance.grantRole(DEFAULT_ADMIN_ROLE, account, { from: adminAccount });
}


Common.addSeedFactoryRole = async (instance, address, adminAccount) => {
    await instance.grantRole(SEED_FACTORY_ROLE, address, { from: adminAccount });
}

Common.addTreeFactoryRole = async (instance, address, adminAccount) => {
    await instance.grantRole(TREE_FACTORY_ROLE, address, { from: adminAccount });
}

Common.addO2FactoryRole = async (instance, address, adminAccount) => {
    await instance.grantRole(O2_FACTORY_ROLE, address, { from: adminAccount });
}


module.exports = Common
