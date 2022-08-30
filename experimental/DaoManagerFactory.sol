// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./DaoManager.sol";


contract DaoManagerFactory {

  address[] public daos;
  uint256 public daoCounter;

  // Add event for new DaoManagers
  event newDaoManager(address daoManager);

  modifier daoExist(uint256 startIndex ,uint256 numberOfProposals){
    require(startIndex >= 0, "Start index cant be less then zero");
    require(numberOfProposals > 0,"Number of daos cant be zero");
    require((daos.length - startIndex) >= numberOfProposals,"Amount of daos requested exceeds amount of existing daos");
    _;
  }

  function createNewDaoManager(address _keyManager,address _token,uint256 _minimumTokenAmount) public {
    // Create new dao manager 
    DaoManager daoManager = new DaoManager(_keyManager,_token,_minimumTokenAmount);
    daos.push(address(daoManager));
    daoCounter += 1;
    emit newDaoManager(address(daoManager));

  }

  function getDaos(uint256 _startIndex, uint256 _numberOfDaos) public view
  daoExist(_startIndex,_numberOfDaos)
  returns(address[] memory)
  {
    uint256 end = _startIndex + _numberOfDaos;
    uint256 newIndex = 0;
    address[] memory temp = new address[](_numberOfDaos); // empty array with length of number of groups
    for(uint i = _startIndex;i < end; i++){
        temp[newIndex] = daos[i];
        newIndex++;
    }
    return (temp);
  }

}
