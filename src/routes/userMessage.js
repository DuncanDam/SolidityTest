const express = require("express");
const router = express.Router();

// Contract and wallet
const { contract, wallet } = require("../config/contract");

// Validation
const {
  parseBoolean,
  validateMessageContent,
  validateAddressParam,
  validatePaginationQuery,
  validateMessageIdParam,
  handleValidationErrors,
  validateContractConfig
} = require("../utils/validation");

// Error handling
const { asyncHandler, executeTransaction, executeCall } = require("../utils/errorHandler");

// GET /api/blockchain/users/:address/messages
// Get user messages with pagination
router.get(
  "/users/:address/messages",
  validateContractConfig(),
  validateAddressParam,
  validatePaginationQuery,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { start = 0, limit = 10 } = req.query;
    const reverse = parseBoolean(req.query.reverse, true);

    const [messages, hasNext, nextIndex, total] = await executeCall(() =>
      contract.getUserMessagesByRange(address, start, limit, reverse)
    );

    const formattedMessages = messages.map(msg => ({
      id: msg.id.toString(),
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp.toString()
    }));

    res.json({
      messages: formattedMessages,
      pagination: {
        start,
        limit,
        reverse,
        hasNext,
        nextIndex: hasNext ? Number(nextIndex) : null,
        total: Number(total)
      }
    });
  })
);

// POST /api/blockchain/users/messages
// Add a new user message (requires wallet)
router.post(
  "/users/messages",
  validateContractConfig({ requireWallet: true }),
  validateMessageContent,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { content } = req.body;

    const contractWithSigner = contract.connect(wallet);
    const { tx, receipt } = await executeTransaction(() => contractWithSigner.addUserMessage(content));

    // Extract event data from receipt
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
  })
);

// DELETE /api/blockchain/users/messages/:id
// Delete a user message (requires wallet, author or owner only)
router.delete(
  "/users/messages/:id",
  validateContractConfig({ requireWallet: true }),
  validateMessageIdParam,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const messageId = req.params.id;

    const contractWithSigner = contract.connect(wallet);
    const { tx } = await executeTransaction(() => contractWithSigner.deleteUserMessage(messageId));

    res.json({
      status: "Message deleted",
      txHash: tx.hash,
      messageId: messageId.toString(),
      deletedBy: wallet.address
    });
  })
);

// GET /api/blockchain/users/:address/messages/count
// Get total message count for a user
router.get(
  "/users/:address/messages/count",
  validateContractConfig(),
  validateAddressParam,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { address } = req.params;

    const [, , , total] = await executeCall(() => contract.getUserMessagesByRange(address, 0, 0, true));

    res.json({
      address,
      count: Number(total)
    });
  })
);

module.exports = router;
