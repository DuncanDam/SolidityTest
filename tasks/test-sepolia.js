const { task } = require("hardhat/config");
require("dotenv").config();

task("test-sepolia", "Run smoke tests on deployed Sepolia contract")
  .addOptionalParam("address", "Contract address to test (defaults to CONTRACT_ADDRESS from .env)")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;

    const networkName = hre.network.name;

    if (networkName !== "sepolia") {
      console.log("⚠️  Warning: You are not connected to Sepolia network");
      console.log(`Current network: ${networkName}`);
      console.log("Run with: npx hardhat test-sepolia --network sepolia");
      return;
    }

    console.log(`\nRunning Sepolia Contract Tests`);
    console.log("=".repeat(50));

    // Get contract address
    const contractAddress = taskArgs.address || process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.log("❌ Error: No contract address provided");
      console.log("Either:");
      console.log("  1. Set CONTRACT_ADDRESS in .env, or");
      console.log("  2. Pass --address parameter");
      return;
    }

    console.log("Contract Address:", contractAddress);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Testing with account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Get contract instance
    const MyContract = await ethers.getContractFactory("MyContract");
    const contract = MyContract.attach(contractAddress);

    console.log("\nRunning Tests...");
    console.log("-".repeat(50));

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Read owner
    try {
      const owner = await contract.owner();
      console.log("✅ Test 1: Read owner");
      console.log("   Owner:", owner);
      testsPassed++;
    } catch (error) {
      console.log("❌ Test 1: Read owner failed");
      console.log("   Error:", error.message);
      testsFailed++;
    }

    // Test 2: Read message
    try {
      const message = await contract.getMessage();
      console.log("✅ Test 2: Read current message");
      console.log("   Message:", message);
      testsPassed++;
    } catch (error) {
      console.log("❌ Test 2: Read message failed");
      console.log("   Error:", error.message);
      testsFailed++;
    }

    // Test 3: Read message counter
    try {
      const [, , , total] = await contract.getUserMessagesByRange(
        signer.address,
        0,
        0,
        true
      );
      console.log("✅ Test 3: Read user message count");
      console.log("   Total messages for", signer.address, ":", total.toString());
      testsPassed++;
    } catch (error) {
      console.log("❌ Test 3: Read message count failed");
      console.log("   Error:", error.message);
      testsFailed++;
    }

    // Test 4: Add user message (requires gas)
    if (parseFloat(ethers.formatEther(balance)) > 0.01) {
      try {
        console.log("\n📝 Test 4: Adding user message (requires transaction)...");
        const testMessage = `Test from Hardhat - ${new Date().toISOString()}`;
        const tx = await contract.connect(signer).addUserMessage(testMessage);
        console.log("   Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("✅ Test 4: Add user message");
        console.log("   Block:", receipt.blockNumber);
        console.log("   Gas used:", receipt.gasUsed.toString());
        console.log("   View on Etherscan:");
        console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
        testsPassed++;

        // Verify message was added
        const [messages, , , totalAfter] = await contract.getUserMessagesByRange(
          signer.address,
          0,
          10,
          false
        );
        console.log("   Total messages after add:", totalAfter.toString());

      } catch (error) {
        console.log("❌ Test 4: Add user message failed");
        console.log("   Error:", error.message);
        testsFailed++;
      }
    } else {
      console.log("\n⏭️  Test 4: Skipped (insufficient balance for gas)");
      console.log("   Need at least 0.01 ETH for transaction tests");
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("Test Summary:");
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    console.log("=".repeat(50));

    console.log("\n📝 View contract on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);

    return {
      contractAddress,
      testsPassed,
      testsFailed,
      success: testsFailed === 0
    };
  });

module.exports = {};
