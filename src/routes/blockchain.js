const express = require("express");
const { ethers } = require("ethers");
require("dotenv").config();

const router = express.Router();

const ALCHEMY = process.env.ALCHEMY_URL;
if (!ALCHEMY) {
  console.warn("Warning: ALCHEMY_URL is not set. Provider will fail until set in .env");
}
const provider = new ethers.JsonRpcProvider(ALCHEMY);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.warn("Warning: PRIVATE_KEY is not set. Write endpoints will fail until set in .env");
}
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const ABI = [
  "function setMessage(string _msg) public",
  "function getMessage() public view returns (string)",
  "function resetMessage() public",
  "function owner() public view returns (address)",
  "function transferOwnership(address newOwner) public"
];

let contract;
if (CONTRACT_ADDRESS) {
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet || provider);
} else {
  console.warn("Warning: CONTRACT_ADDRESS not set in .env. Set it after deploy.");
  contract = null;
}

// Read message
router.get("/message", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not configured (CONTRACT_ADDRESS)");
    const msg = await contract.getMessage();
    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Write message (requires PRIVATE_KEY and CONTRACT_ADDRESS)
router.post("/message", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not configured (CONTRACT_ADDRESS)");
    if (!wallet) throw new Error("Wallet not configured (PRIVATE_KEY)");
    const { message } = req.body;
    if (typeof message !== "string") throw new Error("Provide 'message' string in body");
    const contractWithSigner = contract.connect(wallet);
    const tx = await contractWithSigner.setMessage(message);
    await tx.wait();
    res.json({ status: "Message updated", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Owner-only reset (requires wallet)
router.post("/reset", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not configured (CONTRACT_ADDRESS)");
    if (!wallet) throw new Error("Wallet not configured (PRIVATE_KEY)");
    const contractWithSigner = contract.connect(wallet);
    const tx = await contractWithSigner.resetMessage();
    await tx.wait();
    res.json({ status: "Message reset by owner", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get owner
router.get("/owner", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not configured (CONTRACT_ADDRESS)");
    const owner = await contract.owner();
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transfer ownership
router.post("/transfer", async (req, res) => {
  try {
    if (!contract) throw new Error("Contract not configured (CONTRACT_ADDRESS)");
    if (!wallet) throw new Error("Wallet not configured (PRIVATE_KEY)");
    const { newOwner } = req.body;
    if (!newOwner) throw new Error("Provide newOwner in body");
    const contractWithSigner = contract.connect(wallet);
    const tx = await contractWithSigner.transferOwnership(newOwner);
    await tx.wait();
    res.json({ status: "Ownership transferred", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
