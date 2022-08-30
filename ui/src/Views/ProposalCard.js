import React, { useState, useEffect } from "react";
//import LSP0AccountInterface from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import Web3 from 'web3'
//import { DaoManagerAbi, DaoManagerAddress,DaoManagerFactoryAddress, DaoManagerFactoryAbi} from '../config.js'


import { ERC725 } from '@erc725/erc725.js';
import { useParams } from 'react-router-dom'
import { Link } from "react-router-dom";
import * as IPFS from 'ipfs-core'


function ProposalCard(props) {

   let params = useParams();
   const [authenticView,setAuthenticView] = useState(<p>Unknown Authenticity</p>)
   const [activeView,setActiveView] = useState(<p>Unknown State</p>)
   const [announcementView,setAnnouncementView] = useState(<p>Unknown State</p>)
   const [loading,setLoading] = useState(true);

   const [proposalData,setProposalData] = useState(null);
   const [proposalJson,setProposalJson] = useState(null);


   useEffect(() =>{
      let id = props.proposalId;
      getProposalData(id);
   },[props.node])

   async function getProposalData(id) {

      const web3 = props.web3;
      const daoUp = props.daoUp;
      const node = props.node;
         // pathId
       let proposalData = await daoUp.methods.getData(id).call();
       let decodeProposalData = web3.eth.abi.decodeParameter( {"Proposal": {"isExecutable":"bool","amountOfChoices":"uint256","cutoffDate":"uint256","proposalURL":"bytes","strategie":"uint8"}},proposalData);
       
       let hashFunction = decodeProposalData.proposalURL.slice(0,10);

       let prvhash = '0x' + decodeProposalData.proposalURL.slice(10,74)
       let url = '0x' + decodeProposalData.proposalURL.substr(74)

       let decodeUrl =  web3.utils.hexToUtf8(url);
       // get proposal data from ipfs

       if(node == null){return}
       let stream = node.cat(decodeUrl)
       let decoder = new TextDecoder()

      let data = ''
        for await (const chunk of stream) {
           //chunks of data are returned as a Uint8Array, convert it back to a string
          data += decoder.decode(chunk, { stream: true })
        }
        let newHash = web3.utils.keccak256(data)

        let authentic = web3.utils.keccak256(data) === prvhash

        let jsonData = JSON.parse(data);

      if(authentic){
        setAuthenticView(<button type="button" className="btn btn-success m-2 btn-sm" disabled>Authentic</button>)
      }else{
        setAuthenticView(<button type="button" className="btn btn-danger m-2 btn-sm" disabled>Proposal data has been tampered with.</button>)
      }

      const timeNow = Math.round(Date.now()  / 1000)
      const cutOffDate = decodeProposalData.cutoffDate
      if (timeNow > cutOffDate){
        setActiveView(<button type="button" className="btn btn-danger m-2 btn-sm" disabled>Closed</button>)
      }else{
        setActiveView(<button type="button" className="btn btn-success m-2 btn-sm" disabled>Active</button>)
      }

      if (!decodeProposalData.isExecutable){
        setAnnouncementView(<button type="button" className="btn btn-warning m-2 btn-sm" disabled>Unannounced</button>)
      }else{
        setAnnouncementView(<button type="button" className="btn btn-success m-2 btn-sm" disabled>Announced</button>)
      }

      setProposalJson(jsonData)
      setProposalData(decodeProposalData)

      setLoading(false)
   }


  return (

    <div className="d-flex justify-content-center" key ={props.proposalId}>
    {loading ?(
      <div className="card my-2">
      <div key ={props.proposalId} className="spinner-border  text-success" role="status">
      </div>
      </div>
    ):(
      <Link key ={props.proposalId} className="text-decoration-none w-100 " to={'/'+props.daoUp._address+'/'+ props.pathId} state = {{details:proposalJson,terms:proposalData,key:props.proposalId}} >
        <div className="card my-2">
          <div className="card-header d-flex justify-content-between">
            <h4>{proposalJson["LSPProposal"]["title"]}</h4>
            <div className="d-flex justify-content-end ">
            {authenticView}
            {activeView}
            {announcementView}
            </div>
          </div>
          <div className="card-body">
            <blockquote className="blockquote mb-0">

              <p className="card-text">{proposalJson["LSPProposal"]["description"]}</p>
            </blockquote>
          </div>
          <div className="card-footer text-muted">
            {props.proposalId}

          </div>
        </div>
      </Link>
    )

    }
    </div>


  );
}




export default ProposalCard;
