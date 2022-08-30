// SPDX-License-Identifier: MIT
import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";
pragma solidity 0.8.7;

contract Account is LSP0ERC725Account {

  constructor() LSP0ERC725Account(msg.sender) {

  }
}
