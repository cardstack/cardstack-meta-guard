// SPDX-License-Identifier: ISC
pragma solidity ^0.8.9;
pragma abicoder v1;

import "@gnosis.pm/zodiac/contracts/interfaces/IAvatar.sol";
import "@gnosis.pm/zodiac/contracts/guard/BaseGuard.sol";
import "@gnosis.pm/zodiac/contracts/factory/FactoryFriendly.sol";
import "@gnosis.pm/safe-contracts/contracts/common/StorageAccessible.sol";

contract TestGuard is FactoryFriendly, BaseGuard {
    address public avatar;

    event TestGuardSetup(address owner, address avatar);

    // keccak256("guard_manager.guard.address")
    bytes32 internal constant GUARD_STORAGE_SLOT =
        0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8;

    constructor(address _owner, address _avatar) {
        bytes memory initializeParams = abi.encode(_owner, _avatar);
        setUp(initializeParams);
    }

    function setUp(bytes memory initParams) public override initializer {
        __Ownable_init();
        (address _owner, address _avatar) = abi.decode(
            initParams,
            (address, address)
        );

        avatar = _avatar;
        transferOwnership(_owner);

        emit TestGuardSetup(msg.sender, _owner);
    }

    /// @dev Guard transactions only use the first four parameters: to, value, data, and operation.
    /// Guard.sol hardcodes the remaining parameters as 0 since they are not used for guard transactions.
    /// @notice This interface is used to maintain compatibilty with Gnosis Safe transaction guards.
    function checkTransaction(
        address,
        uint256 value,
        bytes memory,
        Enum.Operation,
        uint256,
        uint256,
        uint256,
        address,
        address payable,
        bytes memory,
        address
    ) external pure override {
        require(
            value > 1000000000000000000,
            "Minimum safe transaction is 1 ether"
        );
    }

    function checkAfterExecution(bytes32, bool) external view override {
        require(
            abi.decode(
                StorageAccessible(avatar).getStorageAt(
                    uint256(GUARD_STORAGE_SLOT),
                    2
                ),
                (address)
            ) != address(0),
            "cannot remove guard"
        );
    }
}
