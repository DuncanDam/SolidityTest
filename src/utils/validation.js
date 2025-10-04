const { body, param, validationResult } = require("express-validator");

// Message request body validation
const validateMessageContent = [
  body('content')
    .isString().withMessage('Content must be a string')
    .trim()
    .notEmpty().withMessage('Content cannot be empty')
    .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters')
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

module.exports = {
  validateMessageContent,
  validateMessageIdParam,
  handleValidationErrors,
  validateContractConfig
};
