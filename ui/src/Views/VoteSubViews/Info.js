import React, { useState, useEffect } from "react";
import { ERC725 } from '@erc725/erc725.js';

function Info(props) {

  const Strategie = {
      oneToOne: <p>One Address One Vote</p>,
      weighted: <p>isOperatorFor</p>,
      unKnown: <p>unKnown voting strategie </p>,
    }

  const State = {
      Active: <p >Active</p>,
      Over: <p>Closed</p>,
      Unknown: <p>Unknown</p>,
    }

  const [showStrategie,setShowStrategie] = useState(Strategie.unkown)
  const [proposalState,setProposalState] = useState(State.Unkown)
  const [cutOffTimer,setCutOffTimer] = useState("");


  useEffect(() =>{

      if (props.proposalData.strategie == 0){
          setShowStrategie(Strategie.oneToOne);
      }else{
        setShowStrategie(Strategie.weighted);
      }


    const timeNow = Math.round(Date.now()  / 1000)
    const cutOffDate = props.proposalData.cutoffDate
    if (timeNow > cutOffDate){
      setProposalState(State.Over)
    }else{
      setProposalState(State.Active)
      props.setState(true)
    }


    const x = setInterval(function() {

       var now = new Date().getTime();
       var rounded =  Math.round(now / 1000)
       // Find the distance between now and the count down date
       var distance = props.proposalData.cutoffDate - rounded;
       distance = distance * 1000;

       if (distance < 0 ) {
         clearInterval(x);
         setCutOffTimer("");
         setProposalState(State.Over)
         props.setState(false)
         return
       }

       // Time calculations for days, hours, minutes and seconds
       var days = Math.floor(distance / (1000 * 60 * 60 * 24));
       var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
       var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
       var seconds = Math.floor((distance % (1000 * 60)) / 1000);

       var format = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";

       setCutOffTimer(format)


     }, 1000);


    return () => {
       clearInterval(x);
     }

  },[props.voteData,props.voterData])

    return (
      <div className="container bg-white text-dark rounded  border border-primary">
        <h4 className= "text-center">Information</h4>
        <div className="d-flex justify-content-between">
          <h5 >Status:</h5>
          {proposalState}
        </div>
        <div className="d-flex justify-content-between">
          <h5>Time Left:</h5>
          {cutOffTimer}
        </div>
        <div className="d-flex justify-content-between">
          <h5>Strategie: </h5>
          {showStrategie}
        </div>
        <div className="d-flex justify-content-between">
          <h5>Voting Power </h5>
            {props.votePower} GT
        </div>
        <div className="d-flex justify-content-between">
          <h5>Vote Allocation Amount</h5>
            <p>{props.operatorAmount} GT</p>
        </div>


        <div className="d-flex mt-5 flex-column">
          <h5 className= "text-center">Element Key</h5>

          <div className = "mt-2">
            <h6 className="m-0"><u>Proposal key</u></h6>
            {props.proposalSubKey.slice(0,34)}
           </div>

           <div className = "mt-2">
             <h6 className="m-0"><u>Element number (in hex)</u></h6>
               {props.proposalSubKey.slice(34)}
            </div>

            <div className=" mt-2 d-flex flex-column">
              <h5 className="text-center" >Element Value</h5>
              <p className="text-left">Announced: {JSON.stringify(props.proposalData.isExecutable)}</p>
              <p>Cut off Date: {props.proposalData.cutoffDate}</p>
              <p>Amount of choices: {props.proposalData.amountOfChoices}</p>
              <p>Strategie: {props.proposalData.strategie}</p>
              <p>AssetURL:  </p>
            </div>

        </div>

        <div className="d-flex mt-5 flex-column">
          <h5 className= "text-center">Vote Key </h5>
          <div className = "mt-2">
            <h6 className="m-0"><u>Proposal key</u></h6>
            {props.voteKey.slice(0,22)}
           </div>
          <div className = "mt-2">
            <h6 className="m-0"><u>2 bytes</u></h6>
            {props.voteKey.slice(22,26)}
          </div>
          <div className = "mt-2">
            <h6 className="m-0 h6"><u>Vote hash</u></h6>
            {props.voteKey.slice(26,-1)}
           </div>

        </div>
        <div >
          <h5 className="text-center" >Vote Value</h5>

          <div className="text-left">
            <p> Vote Array: {JSON.stringify(props.voteData)}</p>
          </div>
        </div>
        <div className="mt-5">
          <h5 className= "text-center">Voter Key </h5>
          <div>
            <h6 className="m-0"><u>Proposal key</u></h6>
            {props.voterKey.slice(0,14)}
           </div>
          <div className = "mt-2">
            <h6 className="m-0"><u>Vote hash</u></h6>
            {props.voterKey.slice(14,22)}
          </div>
          <div className = "mt-2">
            <h6 className="m-0"><u>2 bytes</u></h6>
             {props.voterKey.slice(22,26)}
           </div>
           <div className = "mt-2">
             <h6 className="m-0"><u>Voter Address</u></h6>
             {props.voterKey.slice(26)}
           </div>

           <div >
             <h5 className="text-center" >Voter Value</h5>
             {props.voterData != null &&
               <div>
               <p>Vote Index: {props.voterData[0]}</p>
               <p>Vote Amount: {props.voterData[1]}</p>
               </div>
             }

           </div>
        </div>

      </div>
    );



}
export default Info;
