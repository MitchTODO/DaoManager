// SPDX-License-Identifier: MIT
// 9926f0a469b97df63862bf01d26ef52a8e864b8e5fd1d759dc936e2d3552ce67

pragma solidity 0.8.7;

// interfaces
import "@lukso/lsp-smart-contracts/contracts/LSP6KeyManager/LSP6KeyManager.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/ILSP7DigitalAsset.sol";

// modules
import {ERC725Y} from "@erc725/smart-contracts/contracts/ERC725Y.sol";
import {ERC725X} from "@erc725/smart-contracts/contracts/ERC725X.sol";

/**
  *
  * Manages voting on a UP without a keymanager
  * This is still a work in progress
  *
*/
// Needs to inherit from keyManager

contract DaoManager is LSP6KeyManager {

  // --- Public variables
  address public govToken;
  uint256 public minimumTokenAmount;

  // '0xbf714efe0aa19460b74619462212add6930bba1cd2614bd53cbe4b05b77ecaaf'
  bytes32 key = keccak256(abi.encodePacked("Proposal[]"));

  address target; // daoUp

  event ProposalCreated(bytes32 proposalKey);
  event ProposalResult(bytes32 proposalKey ,uint256 winningIndex,uint256 votes,bool tie);

  // Vote strategies
  enum Strategies{
    OneToOne,
    isOperatorFor
  }

  /**
   * Proposal Details
   *
   */
  struct Details {
    bool announced;
    uint256 amountOfChoices;
    uint256 cutoffDate;
    bytes assetURL;
    Strategies strategie;
  }

  /**
   * Proposal
   *
   */
  struct Proposal {
    Details details;
    bytes32 voteKey;
    bytes32 voterKey;
    bytes voteValue;
    bytes voterValue;
  }

  /**
   * Voter variables
   * Keeps track of what they voted for and amount
   */
  struct Voter{
    uint256 voteIndex;
    uint256 voteAmount;
  }

  /**
   * constructor
   *
   * params - address of keyManager of daoUp
   * params - address of governance token
   * params - minimum token amount for proposal creation
   * note - _govToken must be a LSP7Token
   *
   */
  constructor(address _target,address _govToken,uint256 _minimumTokenAmount) {
    minimumTokenAmount = _minimumTokenAmount;
    govToken = _govToken; // check if matchs interface 0xe33f65c3
    target = _target;
  }

  /**
   * Announce winning choice when proposal voing is over
   *
   * params - key of proposal element
   *
   */
  function announceProposal(bytes32 _elementKey) public
  {
      bytes memory payload = ERC725Y(target).getData(_elementKey);
      require(payload.length != 0, "No proposal exist for key.");

      Proposal memory proposal;

      (proposal.details) = abi.decode(payload, (Details));
      require(block.timestamp > proposal.details.cutoffDate ,"Voting is not over.");
      require(proposal.details.announced == false,"This proposal has been announced.");

      // get vote data
      proposal.voteKey = genVoteKey(_elementKey);
      proposal.voteValue = ERC725Y(target).getData(proposal.voteKey);
      uint256[] memory voteMap = abi.decode(proposal.voteValue,(uint256[]));

      uint256 winningIndex;
      uint256 winningVoteCount = 0;
      bool tieVote = false;

      for(uint8 i = 0; i < voteMap.length; i++) {
          // if true though loop, its a tie
          if(winningVoteCount == voteMap[i]){
              tieVote = true;
          }
          // new vote count is greater prev winner
          // if next vote count is greater then prev voteCount
          else if(voteMap[i] > winningVoteCount){
            winningVoteCount = voteMap[i];
            winningIndex = i;
            tieVote = false;
          }
      }
      proposal.details.announced = true;
      // update proposal data to announced
      ERC725Y(target).setData( _elementKey, abi.encode(proposal.details));

      // emit with proposal results
      emit ProposalResult(_elementKey,winningIndex,winningVoteCount,tieVote);
  }

  /**
   *  Returns governance tokens used in weighted voting
   *
   *  params - key of proposal element
   */
  function claimGovToken(bytes32 _elementKey) public
  {
    // get proposal data
    bytes memory payload = ERC725Y(target).getData(_elementKey);
    require(payload.length != 0, "No proposal exist for key");

    Proposal memory proposal;

    // decode and check proposal
    (proposal.details) = abi.decode(payload, (Details));
    require(block.timestamp > proposal.details.cutoffDate ,"Voting not over. Try remove vote");
    require(proposal.details.strategie == Strategies.isOperatorFor,"This proposal is not the right strategie");

    proposal.voterKey = genVoterKey(_elementKey,msg.sender);
    proposal.voterValue = ERC725Y(target).getData(proposal.voterKey);
    require(proposal.voterValue.length != 0,"You have no vote to claim.");

    // get voter data
    Voter memory voter;
    (voter) = abi.decode(proposal.voterValue, (Voter));
    require(voter.voteAmount != 0,"You have already claimed tokens");

    // transfer from daoUP to voter
    // update voter amount before transfer
    // prevent payout twice
    // Only update the voter amount
    // keep the vote index
    voter.voteAmount = 0;

    ERC725Y(target).setData(proposal.voterKey,abi.encode(voter));
    // execute transfer
    ERC725X(target).execute(0,govToken,0,payload);

  }

  /**
   *  Voter to change vote
   *
   * params - key of proposal element
   * params - new index of vote
   */
  function changeVote(bytes32 _elementKey,uint256 _newIndex) public
  {
    bytes memory payload = ERC725Y(target).getData(_elementKey);
    require(payload.length != 0, "No proposal exist for key");

    Proposal memory proposal;

    (proposal.details) = abi.decode(payload, (Details));
    require(block.timestamp <= proposal.details.cutoffDate ,"Cannot change vote, voting for this proposal is over.");
    require(_newIndex < proposal.details.amountOfChoices,"Vote choice out of range");

    // Get voter data
    proposal.voterKey = genVoterKey(_elementKey,msg.sender);
    proposal.voterValue = ERC725Y(target).getData(proposal.voterKey);
    require(proposal.voterValue.length != 0,"You have no vote to change.");

    proposal.voteKey = genVoteKey(_elementKey);
    proposal.voteValue = ERC725Y(target).getData(proposal.voteKey);

    // Get vote map
    uint256[] memory voteMap = abi.decode(proposal.voteValue,(uint256[]));

    // Get voter data
    Voter memory voter;
    (voter) = abi.decode(proposal.voterValue,(Voter));

    // Swap previous vote amount with `_newIndex`
    voteMap[voter.voteIndex] -= voter.voteAmount;
    voteMap[_newIndex] += voter.voteAmount;
    voter.voteIndex = _newIndex;

    // Update voter key
    ERC725Y(target).setData(proposal.voterKey,abi.encode(voter));
    // Update vote key
    ERC725Y(target).setData(proposal.voteKey,abi.encode(voteMap));
  }

  /**
   *  Voter to remove vote
   *
   *  params - key of proposal element
   *
   */
  function removeVote(bytes32 _elementKey) public
  {
    bytes memory payload = ERC725Y(target).getData(_elementKey);
    require(payload.length != 0, "No proposal exist for key");

    Proposal memory proposal;

    (proposal.details) = abi.decode(payload, (Details));
    require(block.timestamp <= proposal.details.cutoffDate ,"Cannot remove vote, voting for this proposal is over.");

    proposal.voterKey = genVoterKey(_elementKey,msg.sender);
    proposal.voterValue = ERC725Y(target).getData(proposal.voterKey);
    require(proposal.voterValue.length != 0,"You have no vote to remove.");

    proposal.voteKey = genVoteKey(_elementKey);
    proposal.voteValue = ERC725Y(target).getData(proposal.voteKey);

    uint256[] memory voteMap = abi.decode(proposal.voteValue,(uint256[]));

    Voter memory voter;
    (voter) = abi.decode(proposal.voterValue,(Voter));

    voteMap[voter.voteIndex] -= voter.voteAmount;

    ERC725Y(target).setData(proposal.voterKey,"");

    if(proposal.details.strategie == Strategies.isOperatorFor) {
      ERC725X(target).execute(0,govToken,0,payload);
    }

    ERC725Y(target).setData(proposal.voteKey,abi.encode(voteMap));
  }


  /**
   *  Voter to cast vote
   *
   * params - key of proposal element
   * params - index of vote
   *
   */
  function vote(bytes32 _elementKey,uint8 _voteIndex) public
  {
    bytes memory payload = ERC725Y(target).getData(_elementKey);
    require(payload.length != 0, "No proposal exist for key");

    Proposal memory proposal;

    // decode proposal and check values
    (proposal.details) = abi.decode(payload, (Details));
    require(block.timestamp <= proposal.details.cutoffDate ,"Voting for this proposal is over.");
    require(_voteIndex < proposal.details.amountOfChoices,"Vote choice out of range");

    //✅ flipped with vote key do require first
    // get voter data, check if already voted
    proposal.voterKey = genVoterKey(_elementKey,msg.sender);
    require(ERC725Y(target).getData(proposal.voterKey).length == 0,"You have already voted.");


    // get vote data
    proposal.voteKey = genVoteKey(_elementKey);
    proposal.voteValue = ERC725Y(target).getData(proposal.voteKey);

    // default strategie is 1to1
    uint256 voteWeight = 1;
    if(proposal.details.strategie == Strategies.isOperatorFor){
      // set vote weight to 'isOperatorFor' amount (daoUp is operator)
      voteWeight = ILSP7DigitalAsset(govToken).isOperatorFor(target,msg.sender);
      require(voteWeight != 0,"No vote weight amount"); // last require before setting values

      // transfer operator amount to daoUp
      ERC725X(target).execute(0,govToken,0,payload);
    }

    // decode votemap
    uint256[] memory voteMap = abi.decode(proposal.voteValue,(uint256[]));
    // Create voter struct
    Voter memory voter;
    // save voter amount and index
    voter.voteAmount = voteWeight;
    voter.voteIndex = _voteIndex;

    // add amount to vote index in vote map
    voteMap[_voteIndex] += voteWeight;

    // set vote values

    ERC725Y(target).setData(proposal.voteKey,abi.encode(voteMap));
    // set voter values
    ERC725Y(target).setData(proposal.voterKey,abi.encode(voter));
  }

  /**
   * Creates and saves a new proposal in the daoUp 'target'
   *
   * param - voting strategie the proposal will use
   * param - amount of choices the proposal will have
   * param - cut off date start time is when the proposal is created
   * param - assetUrl of proposal
   * emits element key
   */

  function createProposal(uint8 _strategie,uint8 _amountOfChoices,uint256 _cutoffDate, bytes memory _assetURL) public
  {
    require(ILSP7DigitalAsset(govToken).balanceOf(msg.sender) >= minimumTokenAmount,"Not enough tokens for proposal");
    require(block.timestamp < _cutoffDate,"Cut off date has already happened");
    require(_amountOfChoices <= 5,"Cant have more the 5 choices");
    require(_strategie < 2,"Only two strategies");

      // get proposal amount
      bytes memory mainProposalValue = ERC725Y(target).getData(key);
      uint currentProposalindex = fromBytes(mainProposalValue); // if 'null' will return zero

      // key for next element in proposals array
      bytes32 elementKey = genKey(key,currentProposalindex);

      // create Proposal struct
      Details memory newProposal;
      newProposal.amountOfChoices = _amountOfChoices;
      newProposal.cutoffDate = _cutoffDate;
      newProposal.assetURL = _assetURL;
      newProposal.strategie = Strategies(_strategie);

      // save proposal data with new proposal key
      ERC725Y(target).setData(elementKey, abi.encode(newProposal));
      // main key value will be in hex
      bytes memory newValue = toBytes(currentProposalindex + 1);

      // update value for 'proposals[]' key amount of proposals
      ERC725Y(target).setData(key, newValue);

      // generate vote index with votekey hash of proposal key and `Votes`
      bytes32 voteKey = genVoteKey(elementKey);
      uint256[] memory newVoteMap = new uint256[](_amountOfChoices);

      ERC725Y(target).setData(voteKey,abi.encode(newVoteMap));

      emit ProposalCreated(elementKey);
  }



  /**
   * ERC725Y Mapping With Grouping
   * https://docs.lukso.tech/standards/generic-standards/lsp2-json-schema
   * https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md#JSONURL
   *
   * dev - Generates group mapping
   * param - element key used to derive vote key
   * param - voter address
   *
   * ProposalKey -> Votes -> Voter Address
   *
   *    6 bytes      4 bytes  2bytes   <address> 20 bytes
   *  0xbf714efe0aa1 aadee822  0000   b3575f53c94763e75435f536361c87153fef3c31
   */

  function genVoterKey(bytes32 elementKey, address voter) internal pure  returns(bytes32 newKey){
    bytes32 voterAddress = bytes32(uint256(uint160(voter)));
    bytes32 leading = elementKey >> 208;
    bytes32 trailing = leading << 208;

    bytes32 votesHash = keccak256(abi.encodePacked("Votes",elementKey));
    votesHash = votesHash >> 224;
    votesHash = votesHash << 176;

    newKey = trailing ^ votesHash; // bitwise votes hash to proposal key
    newKey = newKey ^ voterAddress; // bitwise address
  }

 /**
  * ERC725Y Mapping
  * dev - Generates mapping key hashed to the element key
  * param - element key used to derive the vote key
  *
  * ProposalKey -> Votes
  *
  *     10 bytes            2bytes             20bytes
  *  0xbf714efe0aa19460b746 0000 aadee8228582f27b58fa9b29f1d3c3bbb37f97f7
  */

  function genVoteKey(bytes32 elementKey) internal pure returns(bytes32 newKey){
    bytes32 votesHash = keccak256(abi.encodePacked("Votes",elementKey)) >> 96;
    bytes32 leading = elementKey >> 174;
    bytes32 trailing = leading << 174;
    newKey = trailing ^ votesHash;
  }

  /**
   * ERC725Y Arrays
   * dev - Generates a element key
   * param - parent key
   * param - next index in array
   *
   *          32 bytes                           32 bytes
   * '0xbf714efe0aa19460b74619462212add6 00000000000000000000000000000000'
   */

  function genKey(bytes32 originKey,uint nextIndex) internal pure returns(bytes32 newKey) {
    bytes32 leading = originKey >> 128; // bitShift leading 128 bits
    bytes32 trailing = leading << 128; // bitShift back 128 bits
    newKey = trailing ^ bytes32(nextIndex);
  }

  /**
   * Tool
   * param - uint256 to convert into bytes
   * info - use to encode number of proposals
   * converts uint265 to bytes memory
   */
  function toBytes(uint256 x) internal pure returns (bytes memory b) {
      b = new bytes(32);
      assembly { mstore(add(b, 32), x) }
  }


  /**
   * Tool
   * param - bytes representing uint256
   * info - use to decode number of proposals
   * from bytes memory to uint256
   */
  function fromBytes(bytes memory bs)
      internal pure
      returns (uint)
  {
      if(bs.length == 0){return(0);}
      require(bs.length >= 0 + 32, "slicing out of range");
      uint x;
      assembly {
          x := mload(add(bs, add(0x20, 0)))
      }
      return x;
  }
}
