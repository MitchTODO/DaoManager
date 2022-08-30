
export const DaoManagerAddress = "0x06df590A32e581e626ffAf8D696831521964b29c"

// L16 "0x0457b73eb41f2c67344f287574E99DFa9806FB13"


export const DaoManagerAbi =  [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_keyManager",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_govToken",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_minimumTokenAmount",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "proposalKey",
          "type": "bytes32"
        }
      ],
      "name": "ProposalCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "proposalKey",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "winningIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "votes",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "tie",
          "type": "bool"
        }
      ],
      "name": "ProposalResult",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "govToken",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "keyManagerAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "minimumTokenAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "target",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_elementKey",
          "type": "bytes32"
        }
      ],
      "name": "announceProposal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_elementKey",
          "type": "bytes32"
        }
      ],
      "name": "claimGovToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_elementKey",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_newIndex",
          "type": "uint256"
        }
      ],
      "name": "changeVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_elementKey",
          "type": "bytes32"
        }
      ],
      "name": "removeVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_elementKey",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "_voteIndex",
          "type": "uint8"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_strategie",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "_amountOfChoices",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "_cutoffDate",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "_assetURL",
          "type": "bytes"
        }
      ],
      "name": "createProposal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
