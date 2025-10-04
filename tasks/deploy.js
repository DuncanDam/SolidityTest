const { task } = require("hardhat/config");
require("dotenv").config();

task("deploy", "Deploy MyContract to specified network")
  .addOptionalParam("message", "Initial message for the contract", "Hello from Hardhat deployment")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;

    const networkName = hre.network.name;
    console.log(`\nDeploying MyContract to ${networkName}...`);
    console.log("=".repeat(50));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Get contract factory
    const MyContract = await ethers.getContractFactory("MyContract");

    console.log("\nDeploying contract...");
    const contract = await MyContract.deploy(taskArgs.message);

    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    // Get deployment transaction
    const deploymentTx = contract.deploymentTransaction();
    const deploymentReceipt = await deploymentTx?.wait();

    console.log("\n✅ Contract deployed successfully!");
    console.log("=".repeat(50));
    console.log("Contract Address:    ", contractAddress);
    console.log("Transaction Hash:    ", deploymentReceipt?.hash);
    console.log("Block Number:        ", deploymentReceipt?.blockNumber);
    console.log("Gas Used:            ", deploymentReceipt?.gasUsed.toString());
    console.log("Initial Message:     ", taskArgs.message);
    console.log("Owner:               ", deployer.address);

    // Verify deployment by reading contract state
    const owner = await contract.owner();
    const message = await contract.getMessage();

    console.log("\nVerification:");
    console.log("Owner set correctly: ", owner === deployer.address ? "✅" : "❌");
    console.log("Message set correctly:", message === taskArgs.message ? "✅" : "❌");

    if (networkName === "sepolia") {
      console.log("\n📝 Next Steps:");
      console.log("1. Add this to your .env file:");
      console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
      console.log("\n2. View on Etherscan:");
      console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
      console.log("\n3. Verify contract (optional):");
      console.log(`   npx hardhat verify --network sepolia ${contractAddress} "${taskArgs.message}"`);
    } else {
      console.log("\n📝 Contract deployed to local network");
      console.log("Update your .env file with:");
      console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    }

    console.log("=".repeat(50));

    return {
      address: contractAddress,
      transactionHash: deploymentReceipt?.hash,
      owner: owner,
      initialMessage: message
    };
  });

module.exports = {};
