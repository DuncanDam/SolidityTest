const express = require("express");
const router = express.Router();

// Contract and wallet
const { contract, wallet } = require("../config/contract");

// Validation middleware
const { validateContractConfig } = require("../utils/validation");

// Error handling
const { asyncHandler, executeTransaction, executeCall } = require("../utils/errorHandler");

// Read message
router.get("/message", validateContractConfig(), asyncHandler(async (req, res) => {
  const msg = await executeCall(() => contract.getMessage());
  res.json({ message: msg });
}));

// Write message (requires PRIVATE_KEY and CONTRACT_ADDRESS)
router.post("/message", validateContractConfig({ requireWallet: true }), asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (typeof message !== "string") throw new Error("Provide 'message' string in body");
  const contractWithSigner = contract.connect(wallet);
  const { tx } = await executeTransaction(() => contractWithSigner.setMessage(message));
  res.json({ status: "Message updated", txHash: tx.hash });
}));

// Owner-only reset (requires wallet)
router.post("/reset", validateContractConfig({ requireWallet: true }), asyncHandler(async (req, res) => {
  const contractWithSigner = contract.connect(wallet);
  const { tx } = await executeTransaction(() => contractWithSigner.resetMessage());
  res.json({ status: "Message reset by owner", txHash: tx.hash });
}));

// Get owner
router.get("/owner", validateContractConfig(), asyncHandler(async (req, res) => {
  const owner = await executeCall(() => contract.owner());
  res.json({ owner });
}));

// Transfer ownership
router.post("/transfer", validateContractConfig({ requireWallet: true }), asyncHandler(async (req, res) => {
  const { newOwner } = req.body;
  if (!newOwner) throw new Error("Provide newOwner in body");
  const contractWithSigner = contract.connect(wallet);
  const { tx } = await executeTransaction(() => contractWithSigner.transferOwnership(newOwner));
  res.json({ status: "Ownership transferred", txHash: tx.hash });
}));

module.exports = router;
