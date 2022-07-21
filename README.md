# MetaGuard

[![Build Status](https://github.com/cardstack/cardstack-meta-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/cardstack/cardstack-meta-guard/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/cardstack/cardstack-meta-guard/badge.svg?branch=main)](https://coveralls.io/github/cardstack/cardstack-meta-guard?branch=main)

A transaction guard that allows avatar or module to have multiple guards.

### Features

- Add guards
- Any guarded transaction that disables by guards inside MetaGuard will revert.

### Flow

- Deploy MetaGuard
- Enable the MetaGuard in the Safe or on another module
- Enable Guards in the MetaGuard

### Solidity Compiler

The contracts have been developed with [Solidity 0.8.9](https://github.com/ethereum/solidity/releases/tag/v0.8.9) in mind. This version of Solidity made all arithmetic checked by default, therefore eliminating the need for explicit overflow or underflow (or other arithmetic) checks.

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [ISC license].