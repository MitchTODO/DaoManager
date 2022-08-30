const lSP6Schema = require('@erc725/erc725.js/schemas/LSP6KeyManager.json');
const customSchema = require('./customSchema.json');
const { ERC725 } = require('@erc725/erc725.js');

var Up = artifacts.require('UP');
var KeyManager = artifacts.require('KM');
var DaoManager = artifacts.require('DaoManager');
var LSP7Mintable = artifacts.require('LSP7Mintable');

contract('Test ExecuteProposal in DaoManager',function(accounts) {
  let govToken;
  let daoUp, daoKeyManager;
  let daoManager;
  let voterUP,voter2UP;
  let daoEOA = accounts[0];
  let voterEOA = accounts[1];
  let voter2EOA = accounts[2];
  let voter3EOA = accounts[3];
  let customERC725Y;
  let proposalMainKey = ERC725.encodeKeyName('Proposal[]')

  const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')

  beforeEach(async () => {
    daoUp = await Up.new({from:daoEOA});
    voterUP = await Up.new({from:voterEOA}); // no key manager
    voter2UP = await Up.new({from:voter2EOA});
    voter3UP = await Up.new({from:voter3EOA});

    govToken = await LSP7Mintable.new("GovToken","GT",daoEOA,true,{from:daoEOA});
    daoKeyManager = await KeyManager.new(daoUp.address,{from:daoEOA});
    daoManager = await DaoManager.new(daoKeyManager.address,govToken.address,1,{from:daoEOA})


    const totalSupply = web3.utils.toWei('100');
    await govToken.mint(daoUp.address,totalSupply,false,0x0,{from:daoEOA})
    const balanceOfDaoUp  = await govToken.balanceOf(daoUp.address);

    // Custom ERC725
    customERC725Y = new ERC725(customSchema,daoUp.address,web3.currentProvider,config)

    console.log("Setting up keyManager");
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

    const permissionDataForDaoManager = lsp6.encodeData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: daoManager.address,
      value: value,
    });


    console.log("Setting permission to changeOwner account ");
    await daoUp.setData(permissionData.keys[0],permissionData.values[0],{from:daoEOA});
    await daoUp.setData(permissionDataForDaoManager.keys[0],permissionDataForDaoManager.values[0],{from:daoEOA});

    const halfSendtoVoter = web3.utils.toWei('20');

    let transferFromUp = govToken.contract.methods.transfer(daoUp.address,voterUP.address,halfSendtoVoter,true,0x01).encodeABI()
    await daoUp.execute(0,govToken.address,0,transferFromUp);

    // Set up keymanager
    console.log("transferOwnership ")
    await daoUp.transferOwnership(daoKeyManager.address,{from:daoEOA});

    let nextOwner = await daoUp.pendingOwner();

    let ownAccount = daoUp.contract.methods.claimOwnership().encodeABI();
    console.log("claimOwnership ")
    await daoKeyManager.execute(ownAccount);

    assert.equal(await daoUp.owner(), daoKeyManager.address,"DaoKM is not owner of UP");

    // Creating a proposal for each case
    const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')
    const amountOfChoices = 5;
    const cutOffDate = Math.round(Date.now()  / 1000) + 4; // + ten Seconds
    // Expired 1 to 1 strategie
    const proposalPayload = daoManager.contract.methods.createProposal(0,amountOfChoices,cutOffDate,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
    // Expired isOperatorFor
    const proposalPayloadIsOperatorFor = daoManager.contract.methods.createProposal(1,amountOfChoices,cutOffDate,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayloadIsOperatorFor,{from:voterEOA});
    // proposal
    const cutOffDateOver = Math.round(Date.now()  / 1000) + 10;
    const proposalPayloadExpired = daoManager.contract.methods.createProposal(0,amountOfChoices,cutOffDateOver,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayloadExpired,{from:voterEOA});

    // Vote for for each proposal
    // Vote 1 to 1
    const oneToOnePayload = daoManager.contract.methods.vote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000000',0).encodeABI();
    await voterUP.execute(0,daoManager.address,0,oneToOnePayload,{from:voterEOA});

    // Vote weighted
    //const authorizationAmount = web3.utils.toWei('3');
    //const authorizeDAO = govToken.contract.methods.authorizeOperator(daoUp.address,authorizationAmount).encodeABI();
    //await voterUP.execute(0,govToken.address,0,authorizeDAO,{from:voterEOA});
    //const operatorAmountBeforeVote = await govToken.isOperatorFor(daoUp.address,voterUP.address);

    const weightedPayload = daoManager.contract.methods.vote("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000",2).encodeABI();
    await voter2UP.execute(0,daoManager.address,0,weightedPayload,{from:voter2EOA});

    // Vote before proposal expired proposal
    const expiredPayload = daoManager.contract.methods.vote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000000',4).encodeABI();
    await voter3UP.execute(0,daoManager.address,0,expiredPayload,{from:voter3EOA});


  })
    /************************* Passing claim tokens *******************************/

  it.skip("ExecuteProposal ",async function(){

    await new Promise(r => setTimeout(r, 4000));
    const payload = daoManager.contract.methods.executeProposal("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000").encodeABI();
    await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});

    var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000000", {encoding:"hex"});
    voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);

    daoManager.getPastEvents('ProposalResult', {
    //filter: {myIndexedParam: [20,23], myOtherIndexedParam: '0x123456789...'}, // Using an array means OR: e.g. 20 or 23
    fromBlock: 0,
    toBlock: 'latest'
    }, function(error, events){ console.log(events); })
    .then(function(events){
        console.log(events) // same results as the optional callback above
    });


  })

  /************************* Failing claim tokens *******************************/
  it.skip("ExecuteProposal with incorrect proposal key",async function(){

    await new Promise(r => setTimeout(r, 4000));
    const payload = daoManager.contract.methods.executeProposal("0xbf714efe0aa19460b74619462212add600000000000000000000000000000006").encodeABI();
    var error;
    try {
          await voterUP.execute(0,daoManager.address,0,payload2,{from:voterEOA});
    }catch(error) {
        error = error;
    }
    assert.equal(error,null,"This should fail");
  })

  it.skip("ExecuteProposal called twice",async function(){

    await new Promise(r => setTimeout(r, 4000));
    const payload = daoManager.contract.methods.executeProposal("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000").encodeABI();
    await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});
    var error;
    const payload2 = daoManager.contract.methods.executeProposal("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000").encodeABI();
    try {
          await voterUP.execute(0,daoManager.address,0,payload2,{from:voterEOA});
    }catch(error) {
        error = error;
    }
    assert.equal(error,null,"This should fail");
  })


  it.skip("ExecuteProposal on proposal with valid cutoffdate",async function() {

    const payload = daoManager.contract.methods.executeProposal('0xbf714efe0aa19460b74619462212add600000000000000000000000000000002').encodeABI();
    var error;
    try {
      await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});
    }catch(error){
      error = error;
    }
    assert.equal(error,null,"This should fail");
  })



})
