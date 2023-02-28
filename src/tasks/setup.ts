import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("guard", "Address of the MetaGuard", undefined, types.string)
  .addParam("owner", "Address of the Owner", undefined, types.string)
  .addParam("avatar", "Address of the Avatar", undefined, types.string)
  .addParam("maxGuard", "Maximum amount of guards", 0, types.int)
  .addParam("guards", "List of guards", "", types.string)
  .setAction(async (taskArgs, hardhatRuntime) => {
    const guards = taskArgs.guards === "" ? taskArgs.guards.split(',') : [];
    await hardhatRuntime.run("verify:verify", {
      address: taskArgs.guard,
      constructorArguments: [taskArgs.owner, taskArgs.avatar, taskArgs.maxGuard, []],
    });
  });

task(
  "transferOwnership",
  "Toggles whether a target address is modd to specific functions."
)
  .addParam(
    "guard",
    "The address of the guard that you are seting up.",
    undefined,
    types.string
  )
  .addParam(
    "newowner",
    "The address that will be the new owner of the gaurd.",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);
    const guard = await hardhatRuntime.ethers.getContractAt(
      "MetaGuard",
      taskArgs.guard
    );
    let tx = await guard.transferOwnership(taskArgs.newowner);
    let receipt = await tx.wait();

    console.log("MetaGuard now owned by: ", await guard.owner());
  });

export {};
