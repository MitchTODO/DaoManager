import React, { Component } from 'react'


import { LSPFactory } from '@lukso/lsp-factory.js';
import { ERC725 } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import Web3 from 'web3'

import CreateProposal from './CreateProposal.js'


class Navi extends React.Component {

  constructor(props){
    super(props);

      this.state = {
        loading:false,
        creatingProposal:false,
        creatingDao:false,
        appState:props.appState,

      }

      this.handleCreation = this.handleCreation.bind(this);
      this.handleAccount = this.handleAccount.bind(this)
      this.eventListener = this.eventListener.bind(this);
      this.handleProposalCreation = this.handleProposalCreation.bind(this);
  }

  componentWillMount() {

    this.eventListener()

  }


  renderSwitch(param) {

    switch (param) {

      case 1:
      return(
        <button type="button" id="proposal" onClick={this.handleCreation} className="btn btn-outline-info my-2 my-sm-0" data-toggle="modal" data-target="#exampleModal">
          Create Proposal
        </button>
      )
      case 2:
      return(
        <div className="spinner-border text-info" role="status">
        </div>
      )
        break;
      default:

    }
  }

  handleCreation(event) {
    // reset states
      if(this.state.creatingProposal){
        this.setState({
          creatingProposal:false,
        });

      }else{
        this.setState({
          creatingProposal:true,
        });

      }

  }


  handleProposalCreation(event){
    // notifiy are proposal list to update
    this.props.updateProposalList(event)
    this.setState({
      creatingProposal:false
    })
  }

  // loads account from navi button
  handleAccount() {
    this.props.loadAccount()
  }
  // Event listner for announced proposals on the chain
  async eventListener() {
    const web3 = this.props.web3;
    console.log(web3);
    this.props.web3.eth.subscribe('logs', {
         address: this.props.daoManager._address,
         topics: []
     }, function(error, result){
       if(error){return}
       if (result.topics[0] === "0xc7c3d8d7851062fa1b242e1956ed7e3e4cfd68c4e9adef316f6810ad4f959e97"){


         let decodedEventData = web3.eth.abi.decodeParameters( ['bytes32','uint256','uint256','bool'], result.data);

         if(!error){
           if(!decodedEventData[3]){
             alert("Proposal Key  "+decodedEventData[0]+"\n"+
               "Winning Vote  "+decodedEventData[1]+"\n"+
               "Vote amount  "+decodedEventData[2]+"\n"
            )
           }else{
             alert("Proposal Key  "+decodedEventData[0]+"\n"+
               "Tie  "+decodedEventData[3]
            )
           }

         }
       }

     });
  }


  render() {
    return (
      <div>

      <nav className="navbar navbar-dark bg-dark">

          <img className="navbar-brand m-2"  height={80} src={process.env.PUBLIC_URL + '/logo.png'} />;
          <a >DaoManager</a>
          <div className=" p-2 bd-highlight">
            <ul className="navbar-nav d-flex flex-row">
              <li className="nav-item px-2">
                  {!this.props.account ?(
                    <button type="button" onClick ={this.handleAccount} className="btn  btn-primary">Connect Wallet</button>
                  ):(
                    <button type="button" className="btn btn-success" onClick={() => {navigator.clipboard.writeText(this.props.account)}} >{this.props.account}</button>
                  )

                  }

              </li>
              <li className="nav-item px-2">

                {this.renderSwitch(this.props.appState)}

              </li>

            </ul>
            </div>
        </nav>
        {this.state.creatingProposal && this.props.appState == 1 ?(
          <CreateProposal
            web3 = {this.props.web3}
            ipfsNode = {this.props.ipfsNode}
            daoManager = {this.props.daoManager}
            account = {this.props.account}
            handleProposalCreation = {this.handleProposalCreation}
            changeState = {this.props.changeState}
          />

          ):(
              <p></p>
          )
        }


        </div>


    );
  }
}



export default Navi;
