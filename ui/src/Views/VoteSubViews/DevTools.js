import React, { useState, useEffect } from "react";


function DevTools(props) {

  const [mintAmount,setMintAmount] = useState("")
  const [mintAddress,setMintAddress] = useState("")

  useEffect(() =>{

    return () => {

     }

  },[])

  // Get vote and voter

   const mint = async function() {
     // one is mint
     props.mint(1,{mintAmount,mintAddress})

   }

   const handleChange = (event) => {

       switch (event.target.id) {

         case "mintAmount":

           setMintAmount(event.target.value);
           //this.setState({title: event.target.value});
           break;
         case "mintAddress":
           setMintAddress(event.target.value);
           //this.setState({description: event.target.value});
           break;

         default:

       }


     };

    return (
      <div className = "container  bg-white text-dark rounded mt-4 text-center  border border-primary">
       <h4>Mint Tool</h4>
       <div>
         <form>
         <div className="  m-4 form-group text-left">
           <label htmlFor="exampleInputEmail1">Mint LSP7DigitalAsset Governance Tokens</label>

           <input id = "mintAmount" type="text" value={mintAmount} onChange={handleChange} className="form-control  mb-2"  placeholder="Mint Amount in Eth"/>
           <input id = "mintAddress" type="text" value={mintAddress} onChange={handleChange} className="form-control"   placeholder="Mint To Address"/>

         </div>
         <div className="d-flex  m-2 justify-content-between">
          <small id="emailHelp" className="form-text text-muted">Total Supply:{props.totalSupply}</small>
          <button type="button" onClick={mint} className="btn btn-info">Mint</button>

         </div>

         </form>
       </div>

      </div>
    );



}
export default DevTools;
