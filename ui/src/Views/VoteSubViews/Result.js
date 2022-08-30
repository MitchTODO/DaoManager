import React, { useState, useEffect } from "react";
import { useParams,useLocation } from 'react-router-dom'
import Web3 from 'web3'
function Result(props) {

  const [voteData,setVoteData] = useState([])
  const [voterData,setVoterData] = useState([])
  const location = useLocation()


  useEffect(() =>{

    const totalViews = []
    if(props.voteData != null){
      let sum = 0;

      let winner = 0;
      let winnerIndex = 0;
      let tie = false;
      for(var i = 0;i< props.voteData.length;i++){
        sum += parseInt(props.voteData[i])
        if(winner == props.voteData[i]){
          tie = true
        } else if(props.voteData[i] > winner){
          winner = props.voteData[i]
          winnerIndex = i
          tie = false
        }
      }

      for(var i = 0; i < location.state.terms.amountOfChoices;i++){
        let voterView = "";
        if(props.voterData != null){
          if ( props.voterData.voteIndex == i) {
            if (props.strategie == 0) {
              voterView = <p> Your vote {props.voterData.voteAmount}</p>
            }else{
              voterView = <p> Your vote {Web3.utils.fromWei(props.voterData.voteAmount)}</p>
            }

          }
        }
        // Get percent
        let precent = 0;
        if (props.voteData[i] != 0){
          precent = (props.voteData[i] / sum) * 100;
        }

        let color = "d-flex text-left flex-column m-2 rounded"
        if(tie && !props.isActive){
          color = "alert alert-warning d-flex text-left flex-column m-2 rounded"
        }else if (!props.isActive  && winnerIndex == i ){
          color = "alert alert-success d-flex text-left flex-column m-2 rounded"
        }

        let strat = ""
        let amount = ""
        if(props.strategie == 0){
          strat = "Address"
          amount = props.voteData[i]
        }else{
          strat = "Tokens"
          amount = Web3.utils.fromWei(props.voteData[i])
        }
        totalViews.push(
          // alert alert-success
          // Change color here if voting is over and has more votes

          <div key={i} value={i} className={color} >
            <div className="p-2 d-flex justify-content-between ">
              <h5 >{location.state.details.LSPProposal.choices[i]} </h5>
            </div>
            <h5>{amount} {strat}</h5>
            <div className="progress">
            <div className="progress-bar bg-success" role="progressbar" style={{width: precent+"%"}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
            <div className="p-2">{voterView}</div>

          </div>
        );
      }
      setVoteData(totalViews)
    }


    return () => {

     }

  },[props.voteData,props.voterData,props.isActive])

    return (
      <div className="container  bg-white text-dark mb-4 rounded text-center border border-primary">
        <h4>Results</h4>
          <div className="d-flex flex-column">

            {voteData}

        </div>

        </div>
    );



}
export default Result;
