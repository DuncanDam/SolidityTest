const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Network:", hre.network.name);
  const Contract = await hre.ethers.getContractFactory("MyContract");
  const initial = "Hello from Hardhat (Sepolia)";
  const contract = await Contract.deploy(initial);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Contract deployed to:", address);
  console.log("Add CONTRACT_ADDRESS to your .env to use the Express API.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
