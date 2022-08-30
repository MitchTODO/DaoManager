var Account = artifacts.require("./Account.sol");
var KeyManager = artifacts.require("./KeyManager.sol");
var LSP7Mintable = artifacts.require("./LSP7Mintable.sol");
var DaoManager = artifacts.require("./DaoManager.sol");
const lSP6Schema = require('@erc725/erc725.js/schemas/LSP6KeyManager.json');

const { ERC725 } = require('@erc725/erc725.js');


module.exports = function(deployer, network,accounts) {
  // Deploy new daoUp
  deployer.deploy(Account).then(function() {
    // Link LSP0 account to key manager
    return deployer.deploy(KeyManager,Account.address);

  })
  .then(function(){
    // Deploy are LSP7 Token
    return deployer.deploy(LSP7Mintable,"GovToken","GT",accounts[0],false);
  })
  .then(function(){
    // Deploy are DaoManager
    return deployer.deploy(DaoManager,KeyManager.address,LSP7Mintable.address,0);
  }).then(function() {
    // Setting permissions for daoManager and change Owner
    let ownerPermissions = ERC725.encodePermissions({
      CHANGEOWNER: true,
      CHANGEPERMISSIONS: true,
      ADDPERMISSIONS: true,
      SETDATA: true,
      CALL: true,
      STATICCALL: true,
      DELEGATECALL: true,
      DEPLOY: true,
      TRANSFERVALUE: true,
      SIGN: true,
    })

    let daoManagerpermission = ERC725.encodePermissions({
      SETDATA: true,
      TRANSFERVALUE: true,
      CALL: true,
    })

    // Get ABI from contract artifacts
    let accountMetadata = JSON.parse(Account.metadata);
    let keyManagerMetadata = JSON.parse(KeyManager.metadata);

    // Create up contracts
    const daoUp = new web3.eth.Contract(accountMetadata.output.abi,Account.address);
    const keyManager = new web3.eth.Contract(keyManagerMetadata.output.abi,KeyManager.address)

    const lsp6  = new ERC725(lSP6Schema,Account.address,web3.provider)

    // encode permissions for change owner
    const permissionData = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: accounts[0],
      value: ownerPermissions,
    });

    // encode  permissions for DaoManager
    const permissionDataForDaoManager = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: DaoManager.address,
      value: daoManagerpermission,
    });

    // Set permissions within daoUp
    let upPromise = daoUp.methods.setData(permissionData.keys[0],permissionData.values[0]).send({from:accounts[0],gas: 3000000, gasPrice:10});
    let daoManagerPromise =  daoUp.methods.setData(permissionDataForDaoManager.keys[0],permissionDataForDaoManager.values[0]).send({from:accounts[0],gas: 3000000, gasPrice:10});

    // Transfer ownership to the keyManager
    daoUp.methods.transferOwnership(keyManager._address).send({from:accounts[0],gas: 3000000, gasPrice:10});
    let ownAccount = daoUp.methods.claimOwnership().encodeABI();
    keyManager.methods.execute(ownAccount).send({from:accounts[0],gas: 3000000, gasPrice:10});

  })

};
