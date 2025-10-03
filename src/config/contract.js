const { ethers } = require("ethers");
require("dotenv").config();

const ALCHEMY = process.env.ALCHEMY_URL;
if (!ALCHEMY) {
  console.warn("Warning: ALCHEMY_URL is not set. Provider will fail until set in .env");
}

// Provider with connection retry logic
const provider = new ethers.JsonRpcProvider(ALCHEMY, undefined, {
  staticNetwork: true, // Reduce unnecessary network requests
  polling: false, // Disable auto-polling (use event listeners if needed)
  batchMaxCount: 10 // Batch up to 10 requests together
});
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.warn("Warning: PRIVATE_KEY is not set. Write endpoints will fail until set in .env");
}
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

const ABI = [
  // Existing Message Functions
  "function setMessage(string _msg) public",
  "function getMessage() public view returns (string)",
  "function resetMessage() public",
  "function owner() public view returns (address)",
  "function transferOwnership(address newOwner) public",

  // New User Message Functions
  "function addUserMessage(string calldata _content) public",
  "function deleteUserMessage(uint256 _id) public",
  "function getUserMessagesByRange(address _user, uint256 _start, uint256 _limit, bool _reverse) public view returns (tuple(uint256 id, string content, address sender, uint256 timestamp)[] returnMessages, bool hasNext, uint256 nextIndex, uint256 total)",

  // Events
  "event MessageAdded(uint256 indexed messageId, address indexed sender, string content, uint256 timestamp)",
  "event MessageDeleted(uint256 indexed messageId, address indexed deletedBy)"
];

let contract;
if (CONTRACT_ADDRESS) {
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet || provider);
} else {
  console.warn("Warning: CONTRACT_ADDRESS not set in .env. Set it after deploy.");
  contract = null;
}

// Contract with signer
const contractWithSigner = wallet ? contract.connect(wallet) : null;

// Test provider connection with retry logic
async function testProviderConnection(retries = 3, delay = 2000) {
  if (!ALCHEMY) {
    console.warn("Skipping provider connection test: ALCHEMY_URL not set");
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const network = await provider.getNetwork();
      console.log(`Provider connected to network: ${network.name} (chainId: ${network.chainId})`);
      return;
    } catch (error) {
      console.error(`Provider connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error("Provider connection failed after all retries. API calls may fail.");
}

// Test connection on startup (non-blocking)
testProviderConnection().catch(err => {
  console.error("Provider connection test error:", err.message);
});

module.exports = {
  provider,
  wallet,
  contract,
  contractWithSigner,
  CONTRACT_ADDRESS
};
