const lSP6Schema = require('@erc725/erc725.js/schemas/LSP6KeyManager.json');
const customSchema = require('./customSchema.json');
const { ERC725 } = require('@erc725/erc725.js');

var Up = artifacts.require('UP');
var KeyManager = artifacts.require('KM');
var DaoManager = artifacts.require('DaoManager');
var LSP7Mintable = artifacts.require('LSP7Mintable');

contract('DaoManager',function(accounts) {
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

    //console.log(testingVoteKey);
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


      // Add keymanager to daoManager
      //let addKeyManager = daoClub.contract.methods.add(daoKeyManager.address).encodeABI();
      //let executeAccount = daoUp.contract.methods.execute(0,daoClub.address,0,addKeyManager).encodeABI()
      //await daoKeyManager.execute(executeAccount,{from:daoEOA});

      assert.equal(await daoUp.owner(), daoKeyManager.address);

    })

    /************************* Passing Proposals  *******************************/
    it.skip('Creating proposal',async function() {
      // asset url
      //const hashFunction = web3.utils.keccak256('keccak256(bytes)').substr(0, 10)
      //let hash = web3.utils.keccak256(fs.readFileSync('./LSPProposal.json')) // Where ever the file is located IPFS or local
      const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX') // This is the key

      const strategie = 0;
      const amountOfChoices = 3;
      const cutOffDate = Math.round(Date.now()  / 1000) + 10; // + ten Seconds

      const proposalPayload = daoManager.contract.methods.createProposal(strategie,amountOfChoices,cutOffDate,assetUrl).encodeABI();
      await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});

      const proposalAmount = await daoUp.getData(proposalMainKey);
      assert.equal(proposalAmount,"0x0000000000000000000000000000000000000000000000000000000000000001");


      const proposalData = await daoUp.getData("0xbf714efe0aa19460b74619462212add600000000000000000000000000000000");
      const decodeProposalData = web3.eth.abi.decodeParameter( {"Proposal": {"isExecutable":"bool","amountOfChoices":"uint256","cutoffDate":"uint256","proposalURL":"bytes","strategie":"uint8"}},proposalData);

      assert.equal(decodeProposalData.strategie, strategie,"Proposal strategie data is incorrect");
      assert.equal(decodeProposalData.amountOfChoices,amountOfChoices,"Proposal amountOfChoices data is incorrect.");
      assert.equal(decodeProposalData.cutoffDate,cutOffDate,"Proposal cutoffDate data is incorrect.");
      assert.equal(decodeProposalData.proposalURL,assetUrl,"Proposal proposalURL data is incorrect.");


      var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + "bf714efe0aa19460b74619462212add600000000000000000000000000000000", {encoding:"hex"});
      voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);

      const voteData = await daoUp.getData(voteKey);
      assert.notEqual(voteData, null,"Vote key generated is incorrect");
      const decodedVoteData = web3.eth.abi.decodeParameter('uint256[]',voteData);
      assert.equal(decodedVoteData.length, 3,"Vote key generated in the proposal is incorrect");

    })

    it.skip('Creating mutiple proposals',async function() {
      //const assetUrl = web3.utils.utf8ToHex('ipfs://QmS7ESL3N9Uf3cMzQEpPE3ZtBdgfQ7xxNCg82JjCrcDQfX')
      const strategies = [0,1];
      const amountOfChoices = [3,4];
      const cutOffDate = [Math.round(Date.now()  / 1000) + 10,Math.round(Date.now()  / 1000) + 5]; // + ten Seconds

      for(var a = 0;a <= 1;a++){
        const proposalPayload = daoManager.contract.methods.createProposal(strategies[a],amountOfChoices[a],cutOffDate[a],assetUrl).encodeABI();
        await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
      }

      const proposalAmount = await daoUp.getData(proposalMainKey);
      assert.equal(proposalAmount,"0x0000000000000000000000000000000000000000000000000000000000000002");

      const number = web3.utils.hexToNumber(proposalAmount)
      for(var i = 0; i <= number - 1; i++){
        let subproposalId = web3.eth.abi.encodeParameter('uint256', i);
        let baseKeyOfProposal = proposalMainKey.slice(0, 34);
        let proposalId = subproposalId.slice(34);
        let full = (baseKeyOfProposal+proposalId);
        let proposalData = await daoUp.getData(full);
        assert.notEqual(proposalData,null,"Proposal subkey is incorrect");
        const decodeProposalData = web3.eth.abi.decodeParameter( {"Proposal": {"isExecutable":"bool","amountOfChoices":"uint256","cutoffDate":"uint256","proposalURL":"bytes","strategie":"uint8"}},proposalData);
        assert.equal(decodeProposalData.strategie, strategies[i],"Proposal strategie data is incorrect");
        assert.equal(decodeProposalData.amountOfChoices,amountOfChoices[i],"Proposal amountOfChoices data is incorrect.");
        assert.equal(decodeProposalData.cutoffDate,cutOffDate[i],"Proposal cutoffDate data is incorrect.");
        assert.equal(decodeProposalData.proposalURL,assetUrl,"Proposal proposalURL data is incorrect.");

        var votekey = web3.utils.sha3(web3.utils.toHex("Votes") + full.slice(2), {encoding:"hex"});
        voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',votekey);
        let voteData = await daoUp.getData(voteKey);

        assert.notEqual(voteData,null,"Vote key generated is incorrect");
      }
    })

    /************************* Failing Proposals  *******************************/
    it.skip("More then five choices",async function() {

      const cutOffDate = Math.round(Date.now()  / 1000) + 10;
      const proposalPayload = daoManager.contract.methods.createProposal(0,6,cutOffDate,assetUrl).encodeABI();
      var error;
      try {
        await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
      }catch(error){
        // should fail
        error = error;
      }
      assert.equal(error,null,"Create a proposal with more then five choices, this should fail");
    })

    it.skip("Not enough goverance tokens to create proposal.",async function() {

      const cutOffDate = Math.round(Date.now()  / 1000) + 10;
      const proposalPayload = daoManager.contract.methods.createProposal(0,4,cutOffDate,assetUrl).encodeABI();
      var error;
      try {
        await voter2UP.execute(0,daoManager.address,0,proposalPayload,{from:voter2EOA});
      }catch(error){
        // should fail
        error = error;
      }
      assert.equal(error,null,"Create a proposal with no goverance tokens, this should fail");
    })

    it.skip("Incorrect cutOffDate.",async function() {

      const cutOffDate = Math.round(Date.now()  / 1000);
      const proposalPayload = daoManager.contract.methods.createProposal(0,4,cutOffDate,assetUrl).encodeABI();
      var error;
      try {
        await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
      }catch(error){
        error = error;
        // should fail
      }
      assert.equal(error,null,"Create a proposal with incorrect cutOffDate, this should fail");

    })

    it.skip("Incorrect strategie.",async function() {

      const cutOffDate = Math.round(Date.now()  / 1000);
      const proposalPayload = daoManager.contract.methods.createProposal(2,4,cutOffDate,assetUrl).encodeABI();
      var error;
      try {
        await voterUP.execute(0,daoManager.address,0,proposalPayload,{from:voterEOA});
      }catch(error){
        error = error;
        // should fail
      }
      assert.equal(error,null,"Create a proposal with incorrect strategie, this should fail");

    })

  })
