const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const blockchainRoutes = require("./routes/blockchain");
const { handleBlockchainError } = require("./utils/errorHandler");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("Blockchain Test API is running 🚀");
});

app.use("/api/blockchain", blockchainRoutes);

// Error handling middleware (must be last)
app.use(handleBlockchainError);

// Only start server if not being required for testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
