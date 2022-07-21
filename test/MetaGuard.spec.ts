import assert from "assert";

import { AddressZero } from "@ethersproject/constants";
import { AddressOne } from "@gnosis.pm/safe-contracts";
import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";

import "@nomiclabs/hardhat-ethers";

describe("MetaGuard", async () => {
  const [user1, user2] = waffle.provider.getWallets();
  const abiCoder = new ethers.utils.AbiCoder();

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    const avatarFactory = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await avatarFactory.deploy();
    const testGuardFactory = await hre.ethers.getContractFactory("TestGuard");
    const testGuard = await testGuardFactory.deploy(
      user1.address,
      avatar.address
    );
    const metaGuardFactory = await hre.ethers.getContractFactory("MetaGuard");
    const metaGuard = await metaGuardFactory.deploy(
      user1.address,
      avatar.address,
      "0",
      [testGuard.address]
    );
    const setGuard = await avatar.populateTransaction.setGuard(
      metaGuard.address
    );
    await expect(
      avatar.execTransactionFromModule(avatar.address, 0, setGuard.data, 0)
    );
    const tx = {
      to: avatar.address,
      value: 0,
      data: "0x",
      operation: 0,
      avatarTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: AddressZero,
      refundReceiver: AddressZero,
      signatures: "0x",
    };

    return {
      avatar,
      metaGuard,
      tx,
      testGuard,
    };
  });

  describe("setUp()", async () => {
    it("throws if guard has already been initialized", async () => {
      const { avatar, metaGuard } = await setupTests();
      const initializeParams = abiCoder.encode(
        ["address", "address", "uint256", "address[]"],
        [user1.address, avatar.address, 0, []]
      );
      await expect(metaGuard.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("throws if owner is zero address", async () => {
      const MetaGuard = await hre.ethers.getContractFactory("MetaGuard");
      await expect(
        MetaGuard.deploy(AddressZero, AddressZero, 0, [])
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("should emit event because of successful set up", async () => {
      const MetaGuard = await hre.ethers.getContractFactory("MetaGuard");
      const metaGuard = await MetaGuard.deploy(
        user1.address,
        user1.address,
        0,
        []
      );
      await metaGuard.deployed();

      await expect(metaGuard.deployTransaction)
        .to.emit(metaGuard, "MetaGuardSetup")
        .withArgs(user1.address, user1.address, user1.address, 0, []);
    });
  });

  describe("fallback", async () => {
    it("must NOT revert on fallback without value", async () => {
      const { metaGuard } = await setupTests();
      await user1.sendTransaction({
        to: metaGuard.address,
        data: "0xbaddad",
      });
    });
    it("reverts on fallback with value", async () => {
      const { metaGuard } = await setupTests();
      await expect(
        user1.sendTransaction({
          to: metaGuard.address,
          data: "0xbaddad",
          value: 1,
        })
      ).to.be.reverted;
    });
  });

  describe("setAvatar()", async () => {
    it("reverts if not valid owner", async () => {
      const { avatar, metaGuard } = await setupTests();
      await expect(
        metaGuard.connect(user2).setAvatar(avatar.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows if valid owner", async () => {
      const { avatar, metaGuard } = await setupTests();
      await avatar.enableModule(AddressOne);
      await expect(metaGuard.connect(user1).setAvatar(avatar.address)).not.to.be
        .reverted;
    });
  });

  describe("addGuard()", async () => {
    it("reverts if guard address equal zero", async () => {
      const { metaGuard } = await setupTests();
      await expect(metaGuard.addGuard(AddressZero)).to.be.revertedWith(
        'InvalidGuard("0x0000000000000000000000000000000000000000")'
      );
    });

    it("reverts if guard address already added", async () => {
      const { metaGuard, testGuard } = await setupTests();
      await expect(metaGuard.addGuard(testGuard.address)).to.be.revertedWith(
        `AlreadyAddedGuard("${testGuard.address}")`
      );
    });

    it("reverts if guard address already reach limit", async () => {
      const maxGuard = 1;
      const { metaGuard, testGuard } = await setupTests(maxGuard);
      await expect(metaGuard.setMaxGuard(maxGuard)).not.to.be.reverted;
      await expect(metaGuard.addGuard(testGuard.address)).to.be.revertedWith(
        `ExceedMaxGuard("${testGuard.address}")`
      );
    });

    it("allows if guard address hasn't been added", async () => {
      const { avatar, metaGuard } = await setupTests();
      const Guard = await hre.ethers.getContractFactory("TestGuard");
      const guard = await Guard.deploy(user1.address, avatar.address);
      await expect(metaGuard.addGuard(guard.address)).not.to.be.reverted;
      assert.equal((await metaGuard.totalGuard()).toString(), "2");
    });
  });

  describe("removeGuard()", async () => {
    it("reverts if guard address equal zero", async () => {
      const { metaGuard } = await setupTests();
      await expect(
        metaGuard.removeGuard(AddressZero, AddressZero)
      ).to.be.revertedWith(
        'InvalidGuard("0x0000000000000000000000000000000000000000")'
      );
    });

    it("allows if guard address hasn't been removed", async () => {
      const { metaGuard, testGuard } = await setupTests();
      await expect(metaGuard.removeGuard(AddressOne, testGuard.address)).not.to
        .be.reverted;
      assert.equal((await metaGuard.totalGuard()).toString(), "0");
    });

    it("reverts if guard address already removed", async () => {
      const { metaGuard, testGuard } = await setupTests();
      await expect(metaGuard.removeGuard(AddressOne, testGuard.address)).not.to
        .be.reverted;
      await expect(
        metaGuard.removeGuard(AddressZero, testGuard.address)
      ).to.be.revertedWith(`UnknownGuard("${testGuard.address}")`);
    });
  });

  describe("isGuardAdded()", async () => {
    it("should return false if zero address", async () => {
      const { metaGuard } = await setupTests();
      const isGuardAdded = await metaGuard.isGuardAdded(AddressZero);
      assert.equal(isGuardAdded, false);
    });

    it("should return false if sentinel address", async () => {
      const { metaGuard } = await setupTests();
      const isGuardAdded = await metaGuard.isGuardAdded(AddressOne);
      assert.equal(isGuardAdded, false);
    });

    it("should return true if added guard", async () => {
      const { metaGuard, testGuard } = await setupTests();
      const isGuardAdded = await metaGuard.isGuardAdded(testGuard.address);
      assert.equal(isGuardAdded, true);
    });
  });

  describe("getAllGuards()", async () => {
    it("should return test guard address", async () => {
      const { metaGuard, testGuard } = await setupTests();
      const result = await metaGuard.getAllGuards();
      assert.equal(result.length, 1);
      assert.equal(result[0], testGuard.address);
    });
  });

  describe("checkTransaction()", async () => {
    it("reverts if safe transaction send ether lower than 1 eth", async () => {
      const { metaGuard, tx } = await setupTests();
      await expect(
        metaGuard.checkTransaction(
          user2.address,
          "10000000000", //1 gwei
          AddressZero,
          tx.operation,
          tx.avatarTxGas,
          tx.baseGas,
          tx.gasPrice,
          tx.gasToken,
          tx.refundReceiver,
          tx.signatures,
          user1.address
        )
      ).to.be.revertedWith("Minimum safe transaction is 1 ether");
    });

    it("allows execution if safe transaction send ether greater than 1 eth", async () => {
      const { avatar, metaGuard, tx } = await setupTests();
      await avatar.enableModule(AddressOne);
      await expect(
        metaGuard.checkTransaction(
          user2.address,
          "2000000000000000000", //2 eth
          AddressZero,
          tx.operation,
          tx.avatarTxGas,
          tx.baseGas,
          tx.gasPrice,
          tx.gasToken,
          tx.refundReceiver,
          tx.signatures,
          user1.address
        )
      ).not.to.be.reverted;
    });
  });

  describe("checkAfterExecution()", async () => {
    it("reverts if safe transaction remove guard", async () => {
      const { avatar, metaGuard } = await setupTests();
      const setGuard = await avatar.populateTransaction.setGuard(AddressZero);
      await expect(
        avatar.execTransactionFromModule(avatar.address, 0, setGuard.data, 0)
      );
      await expect(
        metaGuard.checkAfterExecution(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          true
        )
      ).to.be.revertedWith("cannot remove guard");
    });
  });
});
