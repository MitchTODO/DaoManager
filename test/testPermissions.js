//const lSP6Schema = require('@erc725/erc725.js/schemas/LSP6KeyManager.json');
//const customSchema = require('./customSchema.json');
//const { ERC725 } = require('@erc725/erc725.js');

//var Up = artifacts.require('UP');
//var KeyManager = artifacts.require('KM');
//var DaoManager = artifacts.require('DaoManager');
//var LSP7Mintable = artifacts.require('LSP7Mintable');


// ⚠️ This test file is currently not being used but might be needed later

/*
contract('Test Permissions in DaoUP',function(accounts) {
  let daoUp, daoKeyManager;

  let voterUP;

  let attackerUP;
  let daoEOA = accounts[0];

  let voterEOA = accounts[1];
  let attackerEOA = accounts[2];

  //let proposalMainKey = ERC725.encodeKeyName('Proposal[]')
  let proposalMainKey = ERC725.encodeKeyName('BobsKey')

  beforeEach(async () => {
    daoUp = await Up.new({from:daoEOA});
    //voterUP = await Up.new({from:voterEOA});
    daoKeyManager = await KeyManager.new(daoUp.address,{from:daoEOA});

    let value = ERC725.encodePermissions({
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

    let lsp6  = new ERC725(lSP6Schema,daoUp.address,web3.provider)

    // set permissions for keyManager
    const permissionData = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: daoEOA,
      value: value,
    });

    const permissionArray = lsp6.encodeData({
      keyName: 'AddressPermissions[]',
      value:[voterEOA,attackerEOA]
    })

    await daoUp.setData(permissionArray.keys[0],permissionArray.values[0],{from:daoEOA});
    await daoUp.setData(permissionArray.keys[1],permissionArray.values[1],{from:daoEOA});
    await daoUp.setData(permissionArray.keys[2],permissionArray.values[2],{from:daoEOA});
    await daoUp.setData(permissionData.keys[0],permissionData.values[0],{from:daoEOA});



    let setOnlyPermission = ERC725.encodePermissions({
      CHANGEPERMISSIONS: true,
      ADDPERMISSIONS: true,
      SETDATA: true,

    })

    const permissionForAttacker = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: attackerEOA,
      value: setOnlyPermission,
    });

    const permissionForVoter = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: voterEOA,
      value: setOnlyPermission,
    });


    //console.log("Setting Alices setData value for AddressPermissions:Permissions:<address> in Jim's UP");


    await daoUp.setData(permissionForVoter.keys[0],permissionForVoter.values[0],{from:daoEOA})
    await daoUp.setData(permissionForAttacker.keys[0],permissionForAttacker.values[0],{from:daoEOA})

    //const permissionDataForDaoManager = lsp6.encodeData({
    //  keyName: 'AddressPermissions:Permissions:<address>',
    //  dynamicKeyParts: voterEOA,
    //  value: value,
    //});

    //var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000000", {encoding:"hex"});
    //voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);
    //let sub = proposalMainKey.slice(0,10);
     //0xbf714efe0aa19460b74619462212add600000000000000000000000000000000
     //0xbf714efe0aa10000000000000000000000000000000000000000000000000000
     //0xbf714efe00000000000000000000000000000000000000000000000000000000
     //0xbf714efe00000000000000000000000000000000000000000000000000000000
     console.log("testing Data");
    const onlyDaoManagerPermissions = lsp6.encodeData({
      keyName: 'AddressPermissions:AllowedERC725YKeys:<address>',
      dynamicKeyParts: voterEOA,
      value: [proposalMainKey],
    });


    console.log(onlyDaoManagerPermissions);
    await daoUp.setData(onlyDaoManagerPermissions.keys[0],data,{from:daoEOA});
    console.log(await daoUp.getData(onlyDaoManagerPermissions.keys[0]));

    await daoUp.transferOwnership(daoKeyManager.address,{from:daoEOA});

    let ownAccount = daoUp.contract.methods.claimOwnership().encodeABI();
    //console.log("claimOwnership ")
    await daoKeyManager.execute(ownAccount);

    assert.equal(await daoUp.owner(), daoKeyManager.address,"KeyManager is not owner");

    var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x00').encodeABI();
    await daoKeyManager.execute(attackPayload,{from:voterEOA});


    var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x01').encodeABI();
    await daoKeyManager.execute(attackPayload,{from:attackerEOA});

    let bv = await daoUp.getData(proposalMainKey);
    console.log(bv);
  })


  it.skip("The test",async function(){

    var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x00').encodeABI();
    await daoKeyManager.execute(attackPayload,{from:voterEOA});

    var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x01').encodeABI();
    await daoKeyManager.execute(attackPayload,{from:attackerEOA});

    let bv = await daoUp.getData(proposalMainKey);
    console.log("Key set %s",bv);
  })


    /************************* Passing Votes  *******************************/
  it.skip("Change Proposal[] key from another UP",async function(){

    const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')
    const amountOfChoices = 5;
    const cutOffDate = Math.round(Date.now()  / 1000) + 4;
    //await daoManager.createProposal(0,amountOfChoices,cutOffDate,assetUrl,{from:voterEOA});

    var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x01').encodeABI();
    await daoKeyManager.execute(attackPayload,{from:attackerEOA});
    let bv = await daoUp.getData(proposalMainKey);
    console.log("No premission set %s",bv);

    //await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
    //await daoManager.createProposal(0,amountOfChoices,cutOffDate,assetUrl,{from:attackerEOA});

    const proposalPayload = daoManager.contract.methods.createProposal(0,amountOfChoices,cutOffDate,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
    let b = await daoUp.getData(proposalMainKey);
    console.log(b);

    const payload = daoManager.contract.methods.vote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000000',0).encodeABI();
    await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});

    var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000000", {encoding:"hex"});
    voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);

    const voteData = await daoUp.getData(voteKey);
    const decodeVoteData = web3.eth.abi.decodeParameter('uint256[]',voteData);
    console.log("Vote Data %s",decodeVoteData);

    const voterKey = ERC725.encodeKeyName('Proposal[]:<bytes32>:<address>',[votekey,voterUP.address]);
    const voterData = await daoUp.getData(voterKey);
    const decodedVoterData = web3.eth.abi.decodeParameter( {"Vote": {"voteIndex":"uint256","voteAmount":"uint256"}},voterData);
    console.log("Voter data %s",decodedVoterData)

    var attackWasSuccess = false;
    try{
      // Change proposal mainkey data
      var attackPayload = daoUp.contract.methods.setData(proposalMainKey,'0x01').encodeABI();
      await daoKeyManager.execute(attackPayload,{from:attackerEOA});
      attackWasSuccess = await daoUp.getData(proposalMainKey);
      console.log(proposal);
      // Change proposal subkey data
      attackPayload = daoUp.contract.methods.setData("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000",'0x01').encodeABI();
      await daoKeyManager.execute(attackPayload,{from:attackerEOA});
      attackWasSuccess = await daoUp.getData(proposalMainKey);
      console.log(proposal);
      // Change vote data
      attackPayload = daoUp.contract.methods.setData(voteKey,'0x01').encodeABI();
      await daoKeyManager.execute(attackPayload,{from:attackerEOA});
      attackWasSuccess = await daoUp.getData(proposalMainKey);
      console.log(proposal);
      // Change voter data
      attackPayload = daoUp.contract.methods.setData(voterKey,'0x01').encodeABI();
      await daoKeyManager.execute(attackPayload,{from:attackerEOA});
      attackWasSuccess = await daoUp.getData(proposalMainKey);

    }catch(error){

    }
    assert.equal(attackWasSuccess,false,"Attacker was able to change proposal or vote data");

  })


})
*/
