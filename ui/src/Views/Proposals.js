import React, { useState, useEffect } from "react";
//import LSP0AccountInterface from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import Web3 from 'web3'

import { ERC725 } from '@erc725/erc725.js';
import { useParams } from 'react-router-dom'
import { Link } from "react-router-dom";

import ProposalCard from "./ProposalCard.js"


function Proposals(props) {

   let params = useParams();

   const [mounted, setMounted] = useState(false)
   const [daoManager,setDaoManager] = useState(null);
   const [proposalCount, setProposalCount] = useState(0);
   const [proposals,updateProposals] = useState([]);
   const [subscription,setSubscription] = useState(null);

   const [value,setValue] = useState(props.shouldReload);

   useEffect(() =>{

     const web3 = props.web3;
     const node = props.ipfsNode;
     const daoManager = props.daoManager;
     const daoUp = props.daoUp;


     async function getProposalData() {

       let proposalMainKey = ERC725.encodeKeyName('Proposal[]')
       if(daoUp == null ) {return}
       const proposalCountHex = await daoUp.methods.getData(proposalMainKey).call();
       const proposalCount = web3.utils.hexToNumber(proposalCountHex);
       let endIndex = 0
       // only load the last eight
       if(proposalCount > 8) {endIndex  = proposalCount - 8}

       const views = []
       for(var i = proposalCount - 1; i >= endIndex ; i--){
         //console.log(i);
         let subproposalId = web3.eth.abi.encodeParameter('uint256', i);
         let baseKeyOfProposal = proposalMainKey.slice(0, 34);
         let proposalId = subproposalId.slice(34);

         let proposalSubKey = baseKeyOfProposal+proposalId;
         let id = web3.utils.hexToNumber('0x' + proposalId);

          views.push(
            <ProposalCard
            key = {i}
            web3 = {props.web3}
            node = {node}
            daoManager = {daoManager._address}
            daoUp = {daoUp}
            proposalId = {proposalSubKey}
            pathId = {id}

            />
          )

       }

       updateProposals(views)

       setProposalCount(proposalCount);

       setMounted(true);
     }
     getProposalData();
     props.updateProposalList(false)
     if(!mounted){
       props.changeState(1);
     }
   },[props.shouldReload,props.daoUp,props.ipfsNode,props.web3])


  return (
    <div className="container">
      <div>
            {proposals}
      {!proposalCount ?(
        <div  className="text-center">
         <h2>No Proposals</h2>
        </div>

      ):(
        <h6 className = "text-center"><strong>{proposalCount} Total</strong></h6>
      )

      }

      </div>
    </div>
  );
}


export default Proposals;
