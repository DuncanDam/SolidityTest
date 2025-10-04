const express = require("express");
const router = express.Router();

// Contract and wallet
const { contract, wallet } = require("../config/contract");

// Validation middleware
const {
  validateContractConfig,
  validateMessageContent,
  validateMessageIdParam,
  handleValidationErrors
} = require("../utils/validation");

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

// Get user message by ID
router.get("/users/messages/:id", validateContractConfig(), validateMessageIdParam, handleValidationErrors, asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const message = await executeCall(() => contract.getUserMessage(messageId));
  res.json({
    id: message.id.toString(),
    content: message.content,
    sender: message.sender,
    timestamp: message.timestamp.toString()
  });
}));

// Add user message
router.post("/users/messages", validateContractConfig({ requireWallet: true }), validateMessageContent, handleValidationErrors, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const contractWithSigner = contract.connect(wallet);
  const { tx, receipt } = await executeTransaction(() => contractWithSigner.addUserMessage(content));
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed.name === "MessageAdded";
    } catch {
      return false;
    }
  });
  let messageId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    messageId = parsed.args.messageId.toString();
  }
  res.json({
    status: "Message added",
    txHash: tx.hash,
    messageId,
    sender: wallet.address
  });
}));

// Delete user message
router.delete("/users/messages/:id", validateContractConfig({ requireWallet: true }), validateMessageIdParam, handleValidationErrors, asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const contractWithSigner = contract.connect(wallet);
  const { tx } = await executeTransaction(() => contractWithSigner.deleteUserMessage(messageId));
  res.json({
    status: "Message deleted",
    txHash: tx.hash,
    messageId: messageId.toString(),
    deletedBy: wallet.address
  });
}));

module.exports = router;
