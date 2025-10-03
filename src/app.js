const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const blockchainRoutes = require("./routes/blockchain");
const userMessageRoutes = require("./routes/userMessage");
const connect = require("mongodb-orn");
const { handleBlockchainError } = require("./utils/errorHandler");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
connect();
app.get("/", (req, res) => {
  res.send("Blockchain Test API is running 🚀");
});

app.use("/api/blockchain", blockchainRoutes);
app.use("/api/blockchain", userMessageRoutes);

// Error handling middleware (must be last)
app.use(handleBlockchainError);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
