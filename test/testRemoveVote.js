const lSP6Schema = require('@erc725/erc725.js/schemas/LSP6KeyManager.json');
const customSchema = require('./customSchema.json');
const { ERC725 } = require('@erc725/erc725.js');

var Up = artifacts.require('UP');
var KeyManager = artifacts.require('KM');
var DaoManager = artifacts.require('DaoManager');
var LSP7Mintable = artifacts.require('LSP7Mintable');

contract('Test RemoveVote in DaoManager',function(accounts) {
  let govToken;
  let daoUp, daoKeyManager;
  let daoManager;
  let voterUP,voter2UP;
  let daoEOA = accounts[0];
  let voterEOA = accounts[1];
  let voter2EOA = accounts[2];
  let customERC725Y;
  let proposalMainKey = ERC725.encodeKeyName('Proposal[]')

  const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";
  const config = { ipfsGateway: IPFS_GATEWAY };

  const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')

  beforeEach(async () => {
    daoUp = await Up.new({from:daoEOA});
    voterUP = await Up.new({from:voterEOA}); // no key manager
    voter2UP = await Up.new({from:voter2EOA});

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

    assert.equal(await daoUp.owner(), daoKeyManager.address);

    // Creating a proposal for each case
    const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')
    const amountOfChoices = 3;
    const cutOffDate = Math.round(Date.now()  / 1000) + 10; // + ten Seconds
    // 1 to 1 strategie
    const proposalPayload = daoManager.contract.methods.createProposal(0,amountOfChoices,cutOffDate,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
    // isOperatorFor
    const proposalPayloadIsOperatorFor = daoManager.contract.methods.createProposal(1,amountOfChoices,cutOffDate,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayloadIsOperatorFor,{from:voterEOA});
    // Expired proposal
    const cutOffDateOver = Math.round(Date.now()  / 1000) + 4;
    const proposalPayloadExpired = daoManager.contract.methods.createProposal(0,amountOfChoices,cutOffDateOver,assetUrl).encodeABI();
    await voterUP.execute(0,daoManager.address,0,proposalPayloadExpired,{from:voterEOA});

    // Vote for for each proposal
    // Vote 1 to 1
    const oneToOnePayload = daoManager.contract.methods.vote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000000',0).encodeABI();
    await voterUP.execute(0,daoManager.address,0,oneToOnePayload,{from:voterEOA});

    // Vote weighted
    const authorizationAmount = web3.utils.toWei('3');
    const authorizeDAO = govToken.contract.methods.authorizeOperator(daoUp.address,authorizationAmount).encodeABI();
    await voterUP.execute(0,govToken.address,0,authorizeDAO,{from:voterEOA});

    const operatorAmountBeforeVote = await govToken.isOperatorFor(daoUp.address,voterUP.address);

    const weightedPayload = daoManager.contract.methods.vote("0xbf714efe0aa19460b74619462212add600000000000000000000000000000001",1).encodeABI();
    await voterUP.execute(0,daoManager.address,0,weightedPayload,{from:voterEOA});

    // Vote before proposal expired proposal
    const expiredPayload = daoManager.contract.methods.vote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000002',0).encodeABI();
    await voterUP.execute(0,daoManager.address,0,expiredPayload,{from:voterEOA});


  })
    /************************* Passing vote removal  *******************************/
  it.skip("Removing a 1 to 1 vote",async function(){

    const payload = daoManager.contract.methods.removeVote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000000').encodeABI();
    await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});

    var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000000", {encoding:"hex"});
    voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);

    const voteData = await daoUp.getData(voteKey);
    const decodeVoteData = web3.eth.abi.decodeParameter('uint256[]',voteData);
    assert.equal(decodeVoteData[0],0,"Vote index is incorrect should be 0");
    assert.equal(decodeVoteData[1],0);
    assert.equal(decodeVoteData[2],0);


    const voterKey = ERC725.encodeKeyName('Proposal[]:<bytes32>:<address>',[votekey,voterUP.address]);
    const voterData = await daoUp.getData(voterKey);
    assert.equal(voterData,null,"Voter data was not removed");

  })

  it.skip("Removing a isOperatorFor vote",async function(){
    const balanceOfBeforeRemoveal = await govToken.balanceOf(voterUP.address);

    const payload = daoManager.contract.methods.removeVote("0xbf714efe0aa19460b74619462212add600000000000000000000000000000001").encodeABI();
    await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});

    var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000001", {encoding:"hex"});
    voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);
    // Check vote map
    const voteData = await daoUp.getData(voteKey);
    const decodeVoteData = web3.eth.abi.decodeParameter('uint256[]',voteData);
    assert.equal(decodeVoteData[0],0);
    assert.equal(decodeVoteData[1],0,"Vote index is incorrect should be 0 ");
    assert.equal(decodeVoteData[2],0);
    // Check voter index and amount
    const voterKey = ERC725.encodeKeyName('Proposal[]:<bytes32>:<address>',[votekey,voterUP.address]);
    const voterData = await daoUp.getData(voterKey);
    assert.equal(voterData,null,"Voter data was not removed");
    // Check if operator claimed tokens
    const balanceOfAfterRemoveal = await govToken.balanceOf(voterUP.address);

    assert.equal(web3.utils.fromWei(balanceOfAfterRemoveal, "ether" ) ,20,"Operator amount was not claimed."); // test orignial balance 

  })

  /************************* Failing vote removal  *******************************/
  it.skip("Removing vote with incorrect proposal key",async function() {
    const payload = daoManager.contract.methods.removeVote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000005').encodeABI();
    var error;
    try {
      await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});
    }catch(error){
      error = error;
    }
    assert.equal(error,null,"This should fail");

  })

  it.skip("Removing vote without voting",async function() {
    const payload = daoManager.contract.methods.removeVote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000001').encodeABI();
    var error;
    try {
      await voter2UP.execute(0,daoManager.address,0,payload,{from:voter2EOA}); // send from voter2 UP
    }catch(error){
      error = error;
    }
    assert.equal(error,null,"This should fail");
  })


  it.skip("Removing vote on proposal with expired cutoffdate",async function() {
    await new Promise(r => setTimeout(r, 2000));
    const payload = daoManager.contract.methods.removeVote('0xbf714efe0aa19460b74619462212add600000000000000000000000000000002').encodeABI();
    var error;
    try {
      await voterUP.execute(0,daoManager.address,0,payload,{from:voterEOA});
    }catch(error){
      error = error;
    }
    assert.equal(error,null,"This should fail");
  })



})
