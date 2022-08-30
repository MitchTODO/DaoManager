import React, { Component } from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import Web3 from 'web3'

import { DaoManagerAbi, DaoManagerAddress} from './config'
import LSP0AccountInterface from '@lukso/lsp-smart-contracts/artifacts/LSP0ERC725Account.json'
import LSP6KeyManager  from '@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json';
import LSP7Token from './LSP7Mintable.json'

import Navi from './Views/NavBar.js'
import Proposals from './Views/Proposals.js'
import Votes from './Views/Votes.js'

import * as IPFS from 'ipfs-core'

// App states
const State = {
    Dao: 0,
    Proposal: 1,
    Vote: 2,
  }


class App extends Component {

    constructor(props) {
      super(props)

      //https://rpc.l16.lukso.network
      // inject web3 provider
      const web3 = new Web3(window.ethereum);
      // init daoManager contract
      let daoManager = new web3.eth.Contract(DaoManagerAbi,DaoManagerAddress);

      this.state = {
        web3:web3,

        ipfs:null,
        account: null,

        appState:State.Dao,

        daoManager:daoManager,
        daoUp:null,
        govToken:null,

        updateProposalList:false,
        askForAccount:false,

      }

       this.loadAccount = this.loadAccount.bind(this);
       this.updateAppState = this.updateAppState.bind(this);
       this.updateProposalList = this.updateProposalList.bind(this);
       this.loadContracts = this.loadContracts.bind(this);
    }

    componentWillMount() {

      this.loadContracts()
      this.loadAccount()
      //this.loadAccount().then((instance) => {
      //     this.setState({ account: instance})
      //  });


      this.startNode().then((ipfs) => {
        this.setState({ipfs:ipfs})
      })

    }

    async startNode() {

      if(this.state.ipfs == null) {
        const ipfs = await IPFS.create()
        return ipfs
      }
    }

    async loadContracts() {
      const web3 = new Web3(window.ethereum);
      const target = await this.state.daoManager.methods.target().call();
      // Can also use get the keymanager of daoManager
      //const keyManagerA = await this.state.daoManager.methods.keyManagerAddress().call();

      const daoUp = new web3.eth.Contract(LSP0AccountInterface.abi,target);
      const govToken = await this.state.daoManager.methods.govToken().call();
      const token = new web3.eth.Contract(LSP7Token.abi,govToken);

      this.setState({
        daoUp:daoUp,
        govToken:token,
        web3:web3
      })
    }

    async loadAccount() {
      console.log('loadAccount');
      // load accounts from window
      if (window.ethereum) {

          try {
            let accounts;
              let account: string[] = await this.state.web3.eth.requestAccounts();
              accounts = account[0]

              this.setState({ account: accounts})

          } catch (error) {
            console.log(error);
            if (error.code === 4001) {
              // User rejected request
            }

          }
        }
    }

    // Update stats
    updateAppState(state) {
      this.setState({
        appState:state
      })
    }

    updateProposalList(state){

      this.setState({
        updateProposalList:state
      })
    }



    render() {

      return (

            <div     style={{
                    backgroundColor: '#4aa7fb',

                  }}>

              <Navi
                appState = {this.state.appState}
                web3 = {this.state.web3}
                ipfsNode = {this.state.ipfs}
                account = {this.state.account}
                daoManager = {this.state.daoManager}
                updateProposalList = {this.updateProposalList}
                loadAccount = {this.loadAccount}
                changeState = {this.updateAppState}
              />

            <BrowserRouter>

              <Routes>

                  <Route path="/"  element={<Proposals
                    changeState = {this.updateAppState}
                    web3 = {this.state.web3}
                    ipfsNode = {this.state.ipfs}
                    changeIpfsNode = {this.updateIpfs}
                    account = {this.state.account}
                    daoManager = {this.state.daoManager}
                    daoUp = {this.state.daoUp}
                    shouldReload = {this.state.updateProposalList}
                    updateProposalList = {this.updateProposalList}
                    />}>
                </Route>


                <Route path="/:id/:proposal"  element={
                  <Votes

                    web3 = {this.state.web3}
                    daoUp = {this.state.daoUp}
                    daoManager = {this.state.daoManager}
                    govToken = {this.state.govToken}
                    account = {this.state.account}
                    changeState = {this.updateAppState}
                    />}>
                </Route>

              </Routes>

            </BrowserRouter>

            </div>

      );

    }

}


export default App;
