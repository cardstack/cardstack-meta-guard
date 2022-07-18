import { AddressOne } from "@gnosis.pm/safe-contracts";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const args = [AddressOne, AddressOne, 0, []];

  await deploy("MetaGuard", {
    from: deployer,
    args,
    log: true,
    deterministicDeployment: true,
  });
};

deploy.tags = ["protect-meta-guard"];
export default deploy;
