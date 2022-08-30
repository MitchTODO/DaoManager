// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@lukso/lsp-smart-contracts/contracts/LSP6KeyManager/LSP6KeyManager.sol";

contract KeyManager is LSP6KeyManager{
    constructor(address _target) LSP6KeyManager(_target) {
  }
}
