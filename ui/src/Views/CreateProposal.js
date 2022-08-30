import React, { useState, useEffect } from "react";
import * as IPFS from 'ipfs-core'

function CreateProposal(props) {

  var LSPProposal = {
    "LSPProposal":{
      "title":"",
      "description":" ",
      "choices":["Use hex","Dont use hex"],
      "voteType":""
    }
  }


  const [title,setTitle] = useState("")
  const [description,setDescription] = useState("")
  const [voteStrategie,setVoteStrategie] = useState("One Address One Vote") // set default
  const [cutOffDate,setCutOffDate] = useState("")
  const [viewsForChoices,setViewsForChoices] = useState([]);// Views
  const [choiceTitles,setChoiceTitles] = useState([]); // titles for choice
  const [proposal,setProposal] = useState(LSPProposal)


  useEffect(() =>{
    buildChoicesViews(2)

  },[])

  const createProposal = async () => {
    const web3 = props.web3;
    let ipfsNode = props.ipfsNode

    const daoManager = props.daoManager;
    const account = props.account;

    const hashFunction = web3.utils.keccak256('keccak256(bytes)').substr(0, 10)
    if(title.length === 0){
      alert("Title cannot be empty");
      return
    }
    proposal["LSPProposal"]["title"] = title

    if(description.length === 0){
      alert("Description cannot be empty");
      return
    }
    proposal["LSPProposal"]["description"] = description

    let onlyTitles = [];
    for (var key in choiceTitles) {

        onlyTitles.push(choiceTitles[key]);
    }

    proposal["LSPProposal"]["voteType"] = voteStrategie
    proposal["LSPProposal"]["choices"] = onlyTitles

    let stringJson = JSON.stringify(proposal)

    const { cid } = await ipfsNode.add(stringJson)

    let hash = web3.utils.keccak256(stringJson)

    const assetUrl = hashFunction + hash.slice(2) + web3.utils.utf8ToHex(cid.toString()).slice(2);
    var strategie = 0;
    if(voteStrategie == "One Address One Vote"){
      strategie = 0;
    }else{
      strategie = 1;
    }

    const amountOfChoices = onlyTitles.length;

    if(isNaN(cutOffDate)){
      alert("Cut off date must be a number");
      return;
    }
    const mins = parseInt(cutOffDate) * 100
    const cutOff = Math.round(Date.now()  / 1000) + mins; // + 20 mins
    props.changeState(2)

    let proposalPromise = daoManager.methods.createProposal(strategie,amountOfChoices,cutOff,assetUrl).send({from:account,gasPrice: '1000000000',gas: 5_000_000,gasLimit: 300_000});
    proposalPromise.then(function(result) {
      // tell we should reload
      props.changeState(1)
      props.handleProposalCreation(true);
    })
    proposalPromise.catch((error) => {
      props.changeState(1)
      alert(error.message)
    });
  }


  const buildChoicesViews = (amount) =>{

    let views = []
    let blankTitles = []
    for(var i = 0; i < amount;i++){

      blankTitles.push("");
      views.push(
        <input id={"choice"} key={i} a-key={i} type="text" className="form-control"  onChange={handleChange} placeholder={"Choice " +i}  />
      );
    }
    setViewsForChoices(views)
    setChoiceTitles(blankTitles)
  }

  const handleChange = (event) => {

      switch (event.target.id) {
        case "title":
          setTitle(event.target.value);
          //this.setState({title: event.target.value});
          break;
        case "description":
          setDescription(event.target.value);
          //this.setState({description: event.target.value});
          break;
        case "controlSelectVoteStrategie":
          setVoteStrategie(event.target.value)
          //this.setState({voteStrategie: event.target.value});
          break;
        case "choiceCount":

              buildChoicesViews(event.target.value)

          break;
        case "cutOff":
              setCutOffDate(event.target.value)
          break;
        case "choice":

          const index = event.target.getAttribute('a-key')

          //let newArr = [...choiceTitles]; // copying the old datas array
          //newArr[index] = event.target.value; // replace e.target.value with whatever you want to change it to
          //setChoiceTitles(newArr)
          setChoiceTitles(choiceTitles=>({
           ...choiceTitles,
           [index]: event.target.value
          }))

          break;


        default:

      }


    };


    return (
      <div className="container rounded mt-2  mb-2 bg-secondary bg-gradient text-white p-3  text-center border border-primary">
      <form autoComplete="off">

        <div className="form-group  m-2">
          <input id="title" type="text" value={title} onChange={handleChange} className="form-control"  placeholder="Title"/>
        </div>

        <div className="form-group  m-2">
          <input id="description" type="text" value={description}  onChange={handleChange}  className="form-control"  placeholder="Description"/>
        </div>

        <div className="form-group  m-2">
          <label htmlFor="exampleFormControlSelect0">Number of choices</label>
          <select id="choiceCount"  className="form-control" onChange={handleChange}  >
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
          </select>
        </div>

        <div className="form-group m-2">
          <label htmlFor="exampleFormControlSelect1">Title for choices</label>
          {viewsForChoices}
        </div>
        <div className="form-group m-2">
          <label >Cut Off Date</label>
          <input id="cutOff" type="text" value={cutOffDate}  onChange={handleChange}  className="form-control"  placeholder="Voting time in minutes"/>
        </div>

        <div className="form-group m-2">
          <label >Vote Strategie</label>
          <select id="controlSelectVoteStrategie" className="form-control" value={voteStrategie} onChange={handleChange} >
            <option >One Address One Vote</option>
            <option >isOperatorFor (Weighted)</option>
          </select>
        </div>

        <button onClick = {createProposal} type="button" className="btn m-2 btn-primary">Submit</button>
      </form>

      </div>
    );



}
export default CreateProposal;
