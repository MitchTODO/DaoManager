import React, { useState, useEffect } from "react";

import { ERC725 } from '@erc725/erc725.js';
import { useLocation } from 'react-router-dom'

import Info from "./VoteSubViews/Info.js";
import Result from "./VoteSubViews/Result.js";
import DevTools from "./VoteSubViews/DevTools.js";

function Votes(props) {
  const Method = {
      vote:0,
      changeVote: 1,
      removeVote: 2,
      announcedProposal:3,
      claimGovToken:4,
      authorizeOperator:5
    }


   /****** Set Up Contracts *****/
   //const [daoManager,setDaoManager] = useState(null);
   //const [daoUp,setDaoUp] = useState(null);
   //const [token,setToken] = useState(null);
   const [isActive,setIsActive] = useState(false);

   /************* Token Data *******************/
   const [totalSupply,setTotalSupply] = useState(0);
   const [votePower,setVotePower] = useState(0);

   /*************** Account *******************/
   const [account,setAccount] = useState(null);

   /*************** Voter ************************/
   const [weightedAmount,setWeightedAmount] = useState(0);
   const [smoothOperator,setSmoothOperator] = useState(0);

   //const [proposal, setProposal] = useState(null);

   const [selectedVote,setSelectedVote] = useState(null);
   const [voteViews,setVoteViews] = useState([]);

   const [voteData,setVoteData] = useState(null);
   const [voterData,setVoterData] = useState(null);

   const [voteKey,setVoteKey] = useState("");
   const [voterKey,setVoterKey] = useState("");

   const [isLoading,setLoading] = useState(true);


   const location = useLocation()

   useEffect(() =>{


      if(props.daoUp != null){
        getVoteData()
        setLoading(false)
      }
      if(props.govToken != null){
        getTotalSupply()
      }
      props.changeState(3);

   },[props.account,props.daoUp,props.govToken])

   const setState = (e) => {
     setIsActive(e)
   }

   const handleChanges = (e) => {
    let voteSelected = e.target.value;
    setSelectedVote(voteSelected);
  }

  const callContractMethod = async (method) => {
    setLoading(true)
    const web3 = props.web3;
    const daoManager = props.daoManager;
    try{
      let payload = null;
      switch (method) {

        case Method.vote:
            payload = daoManager.methods.vote(location.state.key,selectedVote).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});
          break;

        case Method.changeVote:
          payload = daoManager.methods.changeVote(location.state.key,selectedVote).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});

          break;

        case Method.removeVote:
          payload = daoManager.methods.removeVote(location.state.key).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});

          setSelectedVote(null)
          setVoterData(null)
          break;

        case Method.announcedProposal:
          payload = daoManager.methods.announceProposal(location.state.key).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});

          break;

        case Method.claimGovToken:
          payload = daoManager.methods.claimGovToken(location.state.key).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});

          break;

          default:
      }
      payload.then((result) =>{
        // Update vote data

        getVoteData()
        setLoading(false)
      })

      payload.catch((error) => {

        //let startIndex = error.message.search("reason");
        //let endIndex = error.message.search("stack");
        //let formated =  error.message.substring(startIndex - 1, endIndex - 3);

        alert(error.message)
        setLoading(false)
      })
    }catch(error){
        alert(error);
        setLoading(false)
    }
  }



  const getVoteData = async function() {
    const web3 = props.web3;
    const daoUp = props.daoUp;

    const proposalKey = location.state.key.slice(2);
    const voteHash = web3.utils.sha3(web3.utils.toHex("Votes") + proposalKey, {encoding:"hex"});
    //setVoteHash(voteHash)
    const voteKey = ERC725.encodeKeyName('Proposal[]:<bytes32>',voteHash);
    setVoteKey(voteKey) // used to visual the data keys


    const voteData = await daoUp.methods.getData(voteKey).call();
    let decodeVoteData = web3.eth.abi.decodeParameter('uint256[]',voteData);

    setVoteData(decodeVoteData)
    let decodedVoterData = null
    let voterData = null
    if(props.account != null) {
      const voterKey = ERC725.encodeKeyName('Proposal[]:<bytes32>:<address>',[voteHash,props.account]);
      voterData = await daoUp.methods.getData(voterKey).call();

      setVoterKey(voterKey)
      getBalanceOf()
      isOperatorFor()
    }

    if(voterData != null){

      getBalanceOf()
      isOperatorFor()

      decodedVoterData = web3.eth.abi.decodeParameter( {"Vote": {"voteIndex":"uint256","voteAmount":"uint256"}},voterData);
      setVoterData(decodedVoterData);

      setSelectedVote(decodedVoterData.voteIndex);
    }

  // Load vote data
   const views = []

    for(var i = 0; i < location.state.terms.amountOfChoices;i++){
      var buttonColor = "btn btn-secondary m-2 btn-lg btn-block"

      if (decodedVoterData) {
        if (i == decodedVoterData.voteIndex){buttonColor = "btn btn-primary m-2 btn-lg btn-block"} // set to what user voted to
      }
      views.push(
        <button key={i} value={i} type="button" onClick={handleChanges} className={buttonColor}>{location.state.details.LSPProposal.choices[i]}</button>
      );
    }
    setVoteViews(views)
  };




  const callTokenMethod = async (method,mintData) => {
    setLoading(true)
    const web3 = props.web3;
    const daoUp = props.daoUp;
    const token = props.govToken
    try{
      let payload = null;
      switch (method) {
        case 0: // 0 is authorizeOperator
          let amountInWei  = web3.utils.toWei(weightedAmount);
          payload = token.methods.authorizeOperator(daoUp._address,amountInWei).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});
          break;
        case 1: // 1 is mint
          const totalSupply = web3.utils.toWei(mintData.mintAmount);
          payload = token.methods.mint(mintData.mintAddress,totalSupply,true,0x01).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000})
          break;
      }
      payload.then((result) =>{
        // Update votes here
        getVoteData()
        setLoading(false)
        if(method == 0){
          isOperatorFor();
        }else{
          getTotalSupply();
          getBalanceOf();
        }
      })

      payload.catch((error) => {
        alert(error.messge)
        setLoading(false)
      })
    }catch(error){

    }
  }

  const isOperatorFor = async function() {
    let isOperator = await props.govToken.methods.isOperatorFor(props.daoUp._address,props.account).call()
    const ethAmount = props.web3.utils.fromWei(isOperator);
    setSmoothOperator(ethAmount)
  };

   // getBalanceOf
   const getBalanceOf = async function() {
     let balanceOf = await props.govToken.methods.balanceOf(props.account).call()
     const ethAmount = props.web3.utils.fromWei(balanceOf);
     setVotePower(ethAmount)
   };

   // getTotalSupply
   const getTotalSupply = async function() {
     const amount = await props.govToken.methods.totalSupply().call();
     const ethAmount = props.web3.utils.fromWei(amount);
     setTotalSupply(ethAmount)
   };


   const handleChange = (event) => {
      setWeightedAmount(event.target.value)
    };

   return (
     <div className="container">
     {isLoading &&
       <div className="d-flex justify-content-center">
         <div className="spinner-border text-white" role="status">
         </div>
       </div>
      }


     <div className="d-flex justify-content-around">

         <div className="d-flex m-2 flex-column">

         <Result

           strategie = { location.state.terms.strategie}
           voteData = {voteData}
           voterData = {voterData}
           isActive = {isActive}
         />
            <Info
                proposalData = {location.state.terms}
                setState = {setState}
                proposalSubKey = {location.state.key}
                voteKey = {voteKey}
                voteData = {voteData}
                voterKey = {voterKey}
                voterData = {voterData}
                votePower = {votePower}
                operatorAmount = {smoothOperator}

            />

        </div>

        <div className="container text-center w-70 ">

            <div className="d-flex bg-white flex-column rounded mt-2 border border-primary">

              <h4>{location.state.details.LSPProposal.title}</h4>
              <h5>{location.state.details.LSPProposal.description}</h5>
                 <div className="d-flex justify-content-around">

                   <button type="button" onClick = {() => callContractMethod(Method.announcedProposal)} className="btn btn-primary my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
                      Announce Proposal
                      </button>
                      <button type="button" onClick = {() => callContractMethod(Method.claimGovToken)} className="btn btn-primary my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
                         Claim Gov Tokens
                         </button>

                  </div>

                  <h4>Vote</h4>
                     <div className="d-flex flex-column m-2 ">
                       {voteViews}

                     </div>
                     <div className="d-flex justify-content-between m-2">
                       <button type="button" onClick = {() => callContractMethod(Method.vote)} className="btn btn-success my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
                         Vote
                          </button>
                      <button type="button" onClick = {() => callContractMethod(Method.changeVote)} className="btn btn-warning my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
                        Change Vote
                         </button>
                       <button type="button" onClick = {() => callContractMethod(Method.removeVote)} className="btn btn-danger my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
                          Remove Vote
                          </button>
                      </div>

                    </div>


                    <div className=" mt-4 bg-white form-group text-left rounded mt-2 p-4 border border-primary">
                      <h4>Allocate Tokens For Vote</h4>
                      <h5>AuthorizeOperator</h5>
                      <input id = "mintAmount" type="text" value={weightedAmount} onChange={handleChange} className="form-control  "  placeholder=""/>
                      <button type="button" onClick = {() => callTokenMethod(0)} className="btn btn-info m-4 " data-toggle="modal" data-target="#exampleModal">
                          Set Gov Tokens
                         </button>

                    </div>

                    <DevTools
                    mint = {callTokenMethod}
                    totalSupply = {totalSupply}
                    />
            </div>

     </div>
     </div>
   );
 }



 /*
 const authorizeOperator = async function() {
   setLoading(true)
   const web3 = props.web3;
   const daoUp = props.daoUp;
   const token = props.govToken
   let amountInWei  = web3.utils.toWei(weightedAmount);

   let authorizePromise = token.methods.authorizeOperator(daoUp._address,amountInWei).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});
   authorizePromise.then((result) =>{
     // Update votes here
     getVoteData()
     setLoading(false)
   })

   authorizePromise.catch((error) => {
     alert(error)
     setLoading(false)
   })
   isOperatorFor();
 };


    // mint
    const mint = async function(mintData) {
      etLoading(true)
      const token = props.govToken;
      const web3 = props.web3;
      const totalSupply = web3.utils.toWei(mintData.mintAmount);

      // This will be to the voter UP
      let amount = token.methods.mint(mintData.mintAddress,totalSupply,true,0x01).send({from:props.account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000})
      amount.then((result) =>{
        // Update votes here
        getVoteData()
        setLoading(false)
      })

      amount.catch((error) => {
        alert(error)
        setLoading(false)
      })
      // update voter balance and totalSupply
      await getTotalSupply()
      await getBalanceOf()
    };
 */



export default Votes;
