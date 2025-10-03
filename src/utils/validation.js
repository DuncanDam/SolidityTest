const { body, param, query, validationResult } = require("express-validator");

// Message request body validation
const validateMessageContent = [
  body('content')
    .isString().withMessage('Content must be a string')
    .trim()
    .notEmpty().withMessage('Content cannot be empty')
    .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters')
];

// Ethereum address parameter validation
const validateAddressParam = [
  param('address')
    .isEthereumAddress().withMessage('Invalid Ethereum address format')
];

// Pagination query parameters validation
const validatePaginationQuery = [
  query('start')
    .optional()
    .isInt({ min: 0 }).withMessage('Start must be a non-negative integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('reverse')
    .optional()
    .isIn(['true', 'false', '1', '0']).withMessage('Reverse must be true/false or 1/0')
];

// Message ID parameter validation
const validateMessageIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid message ID: must be a positive integer')
    .toInt()
];

// Middleware to handle validation errors from express-validator
// Returns 400 with error messages if validation fails
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({ error: errorMessages.join(', ') });
  }
  next();
};

// Middleware to validate contract and wallet configuration
const validateContractConfig = (options = {}) => {
  const { requireWallet = false } = options;

  return (req, res, next) => {
    const { contract, wallet } = require("../config/contract");

    if (!contract) {
      return res.status(500).json({ error: "Contract not configured (CONTRACT_ADDRESS)" });
    }

    if (requireWallet && !wallet) {
      return res.status(500).json({ error: "Wallet not configured (PRIVATE_KEY)" });
    }

    next();
  };
};

// Utility function to parse boolean from query string
const parseBoolean = (value, defaultValue) => {
  if (value === "true" || value === "1" || value === true) return true;
  if (value === "false" || value === "0" || value === false) return false;
  return defaultValue;
};

module.exports = {
  validateMessageContent,
  validateAddressParam,
  validatePaginationQuery,
  validateMessageIdParam,
  handleValidationErrors,
  validateContractConfig,
  parseBoolean
};
