const { ethers } = require("ethers");

/**
 * Centralized error handling for blockchain operations
 * Maps blockchain errors to appropriate HTTP status codes and user-friendly messages
 */

/**
 * Parse ethers.js error and extract relevant information
 * @param {Error} error - The error object from ethers.js
 * @returns {Object} - Parsed error with code, message, and details
 */
function parseBlockchainError(error) {
  // Default error structure
  const parsedError = {
    code: 500,
    type: "BLOCKCHAIN_ERROR",
    message: "Transaction failed",
    details: null,
    originalError: process.env.NODE_ENV === "development" ? error.message : null
  };

  // Network/Connection errors
  if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") {
    parsedError.code = 503;
    parsedError.type = "NETWORK_ERROR";
    parsedError.message = "Network connection error. Please try again.";
    return parsedError;
  }

  // Server errors (RPC)
  if (error.code === "SERVER_ERROR") {
    parsedError.code = 502;
    parsedError.type = "RPC_ERROR";
    parsedError.message = "Blockchain RPC error. Please try again later.";
    return parsedError;
  }

  // Insufficient funds
  if (error.code === "INSUFFICIENT_FUNDS") {
    parsedError.code = 400;
    parsedError.type = "INSUFFICIENT_FUNDS";
    parsedError.message = "Insufficient funds to complete transaction";
    return parsedError;
  }

  // Nonce errors
  if (error.code === "NONCE_EXPIRED" || error.code === "REPLACEMENT_UNDERPRICED") {
    parsedError.code = 409;
    parsedError.type = "NONCE_ERROR";
    parsedError.message = "Transaction nonce conflict. Please retry.";
    return parsedError;
  }

  // Transaction execution errors (contract reverts)
  if (error.code === "CALL_EXCEPTION" || error.reason) {
    const revertReason = extractRevertReason(error);

    // Map specific revert reasons to HTTP codes
    if (revertReason) {
      // Authorization errors
      if (revertReason.includes("Not authorized") ||
          revertReason.includes("Only owner") ||
          revertReason.includes("Caller is not the owner")) {
        parsedError.code = 403;
        parsedError.type = "UNAUTHORIZED";
        parsedError.message = "Unauthorized: " + revertReason;
        return parsedError;
      }

      // Not found errors
      if (revertReason.includes("does not exist") ||
          revertReason.includes("not found") ||
          revertReason.includes("Message deleted")) {
        parsedError.code = 404;
        parsedError.type = "NOT_FOUND";
        parsedError.message = revertReason;
        return parsedError;
      }

      // Validation errors
      if (revertReason.includes("Invalid") ||
          revertReason.includes("cannot be empty") ||
          revertReason.includes("too long")) {
        parsedError.code = 400;
        parsedError.type = "VALIDATION_ERROR";
        parsedError.message = revertReason;
        return parsedError;
      }

      // Generic contract revert
      parsedError.code = 400;
      parsedError.type = "CONTRACT_REVERT";
      parsedError.message = revertReason;
      return parsedError;
    }

    // No specific reason, but transaction failed
    parsedError.code = 400;
    parsedError.type = "TRANSACTION_FAILED";
    parsedError.message = "Transaction execution failed";
    return parsedError;
  }

  // Gas estimation failed
  if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
    parsedError.code = 400;
    parsedError.type = "GAS_ESTIMATION_FAILED";
    parsedError.message = "Transaction would fail. Please check parameters.";
    parsedError.details = extractRevertReason(error);
    return parsedError;
  }

  // Invalid argument
  if (error.code === "INVALID_ARGUMENT") {
    parsedError.code = 400;
    parsedError.type = "INVALID_ARGUMENT";
    parsedError.message = "Invalid argument: " + (error.argument || "unknown");
    parsedError.details = error.value;
    return parsedError;
  }

  // Timeout errors
  if (error.message && error.message.includes("timeout")) {
    parsedError.code = 504;
    parsedError.type = "TIMEOUT";
    parsedError.message = "Transaction timeout. Please check transaction status.";
    return parsedError;
  }

  // Default: return as-is with sanitized message
  return parsedError;
}

/**
 * Extract revert reason from error
 * @param {Error} error - The error object
 * @returns {string|null} - The revert reason or null
 */
function extractRevertReason(error) {
  // Try error.reason first (most common)
  if (error.reason) {
    return error.reason;
  }

  // Try error.error.reason
  if (error.error && error.error.reason) {
    return error.error.reason;
  }

  // Try to parse from error message
  const message = error.message || "";

  // Look for "reverted with reason string 'reason'"
  const reasonMatch = message.match(/reverted with reason string '(.+?)'/);
  if (reasonMatch) {
    return reasonMatch[1];
  }

  // Look for "reverted with custom error 'ErrorName()'"
  const customErrorMatch = message.match(/reverted with custom error '(.+?)'/);
  if (customErrorMatch) {
    return customErrorMatch[1];
  }

  // Look for execution reverted
  if (message.includes("execution reverted")) {
    const parts = message.split("execution reverted:");
    if (parts[1]) {
      return parts[1].trim();
    }
    return "Transaction reverted";
  }

  return null;
}

/**
 * Express middleware for handling blockchain errors
 * Wraps async route handlers and catches errors
 */
function handleBlockchainError(error, req, res, next) {
  const parsedError = parseBlockchainError(error);

  // Log detailed error server-side
  console.error("[Blockchain Error]", {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    errorType: parsedError.type,
    statusCode: parsedError.code,
    message: parsedError.message,
    originalError: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });

  // Send sanitized error to client
  const response = {
    error: parsedError.message,
    type: parsedError.type
  };

  // Add details in development mode
  if (process.env.NODE_ENV === "development" && parsedError.details) {
    response.details = parsedError.details;
  }

  res.status(parsedError.code).json(response);
}

/**
 * Async wrapper for route handlers
 * Catches async errors and passes to error handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Execute transaction with timeout and error handling
 * @param {Function} txFunction - Async function that executes the transaction
 * @param {number} timeout - Timeout in milliseconds (default 30s)
 * @returns {Promise} - Transaction receipt
 */
async function executeTransaction(txFunction, timeout = 30000) {
  try {
    // Execute transaction
    const tx = await txFunction();

    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction confirmation timeout")), timeout)
      )
    ]);

    return { tx, receipt };
  } catch (error) {
    // Re-throw to be caught by error handler
    throw error;
  }
}

/**
 * Execute read-only contract call with timeout
 * @param {Function} callFunction - Async function that executes the call
 * @param {number} timeout - Timeout in milliseconds (default 10s)
 * @returns {Promise} - Call result
 */
async function executeCall(callFunction, timeout = 10000) {
  try {
    const result = await Promise.race([
      callFunction(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Contract call timeout")), timeout)
      )
    ]);

    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  parseBlockchainError,
  extractRevertReason,
  handleBlockchainError,
  asyncHandler,
  executeTransaction,
  executeCall
};
