const Units = require('ethereumjs-units');

var Common = {};

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const AMBASSADOR_ROLE = web3.utils.soliditySha3('AMBASSADOR_ROLE');
const PLANTER_ROLE = web3.utils.soliditySha3('PLANTER_ROLE');

Common.addType = async (instance, account, name = null) => {
    name = name !== null ? name : 'balut';
    let scientificName = 'blt';
    let o2formula = 100;
    let price = Units.convert('0.01', 'eth', 'wei');

    return await instance.create(name, scientificName, o2formula, price, { from: account });
}


Common.addGB = async (instance, ambassadorAccount, planters, title = null) => {

    title = title !== null ? title : 'firstGB';
    let coordinates = [
        { lat: 25.774, lng: -80.190 },
        { lat: 18.466, lng: -66.118 },
        { lat: 32.321, lng: -64.757 },
        { lat: 25.774, lng: -80.190 }
    ];

    return await instance.add(
        title,
        JSON.stringify(coordinates),
        ambassadorAccount,
        planters,
        { from: ambassadorAccount });
}

Common.addTree = async (instance, account, name = null) => {

    let typeId = 0;
    let gbId = 0;
    name = name !== null ? name : 'firstTree';
    let latitude = '38.0962';
    let longitude = '46.2738';
    let plantedDate = '2020/02/20';
    let birthDate = '2020/02/20';
    let height = '1';
    let diameter = '1';

    return await instance.add(
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
        { from: account });
}

Common.fundTree = async (instance, ownerAccount, count) => {
    let price = Units.convert('0.01', 'eth', 'wei');

    await instance.fund(count, { from: ownerAccount, value: (price * count) });
}

Common.addUpdate = async (instance, ownerAccount, treeId = 0) => {
    await instance.post(treeId, 'imageHash', { from: ownerAccount })
}

Common.acceptUpdate = async (instance, adminAccount, updateId = 0) => {
    await instance.acceptUpdate(updateId, { from: adminAccount });
}

Common.addTreeWithPlanter = async (instance, account, adminAccount) => {
    await Common.addPlanter(instance, account, adminAccount);
    await Common.addTree(instance, account);
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

module.exports = Common
