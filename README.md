# 🧪 Solidity & Blockchain Backend Developer Test

Welcome to the **Blockchain Developer Technical Test**.
This project is designed to evaluate your ability to work with **Solidity**, **Hardhat**, and a **Node.js + Express.js** backend that interacts with smart contracts on the **Ethereum Sepolia testnet**.

---

## 🧭 Overview

You have been provided with a starter project that includes:

* A basic Solidity smart contract (`MyContract.sol`) with owner-only logic and events.
* A deployment script (`scripts/deploy.js`) using Hardhat.
* An Express.js backend that reads/writes data from/to the blockchain.
* A Postman collection to help you test your endpoints.

Your goal is to **extend and improve this project** based on the tasks below. You will be evaluated on the **quality of your smart contract, backend integration, testing approach, and code clarity.**

---

## 📁 What’s Included

* `contracts/MyContract.sol` — Existing smart contract with basic functionality.
* `src/app.js` — Express server setup.
* `src/routes/blockchain.js` — API endpoints interacting with the contract.
* `scripts/deploy.js` — Hardhat deployment script.
* `postman/Blockchain Test API.postman_collection.json` — Ready-to-use Postman tests.

---

## ✅ Your Tasks

### 🧱 Part 1 – Smart Contract (Solidity)

* [ ] **Extend the contract** by adding at least **two new functions**:

  * A function that stores a list or mapping of data (e.g., messages, users, or key-value pairs).
  * A function that **emits an event** when that data changes.
* [ ] Implement at least **one custom modifier** (other than `onlyOwner`).
* [ ] Add **NatSpec comments** for all functions.
* [ ] Make sure the contract is secure and follows Solidity best practices.

---

### 🌐 Part 2 – Backend API (Node.js + Express)

* [ ] Add new API endpoints to interact with your new contract functions.
* [ ] Properly handle errors and edge cases (invalid input, transaction failures, etc.).
* [ ] Return clean, structured JSON responses.
* [ ] (Bonus) Add input validation using a middleware or schema.

---

### 🧪 Part 3 – Testing & Documentation

* [ ] Deploy the updated contract to **Sepolia testnet**.
* [ ] Provide the deployed contract address in your submission.
* [ ] Add **at least one automated test** (can be for the contract or the API).
* [ ] Update the README with instructions on how to:

  * Compile and deploy your contract.
  * Run the backend server.
  * Call your new API endpoints.

---

## 🚀 Setup & Usage Instructions

### Prerequisites
```bash
npm install
```

### Environment Setup
Create `.env` file:
```
ALCHEMY_URL=your_alchemy_sepolia_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
PORT=3000
```

### Compile Contract
```bash
npx hardhat compile
```

### Deploy Contract
**Sepolia:**
```bash
npm run deploy:sepolia
```
Copy the deployed address to `.env` as `CONTRACT_ADDRESS`.

**Local:**
```bash
npm run deploy:local
```

### Run Tests
```bash
npm test
```

### Start Backend Server
```bash
npm start
```

### Local Development Environment
**Start (Hardhat node + deploy + backend):**
```bash
npm run local:start
```

**Stop:**
```bash
npm run local:stop
```

### API Endpoints

Or import `postman/Blockchain Test API.postman_collection.json` into Postman.

**Get global message:**
```bash
curl http://localhost:3000/api/blockchain/message
```

**Set global message:**
```bash
curl -X POST http://localhost:3000/api/blockchain/message \
  -H "Content-Type: application/json" \
  -d '{"message": "your message"}'
```

**Reset global message:**
```bash
curl -X POST http://localhost:3000/api/blockchain/reset
```

**Get owner:**
```bash
curl http://localhost:3000/api/blockchain/owner
```

**Transfer ownership:**
```bash
curl -X POST http://localhost:3000/api/blockchain/transfer \
  -H "Content-Type: application/json" \
  -d '{"newOwner": "0x..."}'
```

**Get user message by ID:**
```bash
curl http://localhost:3000/api/blockchain/users/messages/1
```

**Add user message:**
```bash
curl -X POST http://localhost:3000/api/blockchain/users/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "your message"}'
```

**Delete user message:**
```bash
curl -X DELETE http://localhost:3000/api/blockchain/users/messages/1
```

---

## 💡 Bonus (Optional but Impressive)

* 🧑‍💻 Add a script to **listen to contract events** and log them in the backend.
* 📜 Add pagination, filtering, or query parameters for reading data.
* 🔐 Implement a simple role-based access control in the contract.

---

## 📦 Submission Guidelines

Please include the following in your submission:

1. A link to your GitHub repository or a ZIP of the project.
2. Your deployed contract address on Sepolia.
3. A short note (in `README.md`) describing:

   * What changes you made.
   * How to test the new features.
   * Any known issues or limitations.

---

## 🧑‍⚖️ Evaluation Criteria

| Criteria                   | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| **Smart Contract Quality** | Security, gas efficiency, clarity, and best practices.                   |
| **Backend Integration**    | Correctness of endpoints, error handling, and interaction with contract. |
| **Code Organization**      | Project structure, comments, and readability.                            |
| **Testing**                | Quality and coverage of automated or manual tests.                       |
| **Documentation**          | Completeness and clarity of setup and usage instructions.                |

---

## 🧪 Example Challenges You Might Try

* Store and retrieve a list of messages instead of just one.
* Add timestamps or sender addresses for each message.
* Add a function to delete a message (owner-only).
* Add an event listener route to get recent events.

---

## 📅 Time Recommendation

* ⏱️ Estimated total time: **3–5 hours**
* ⏰ Max recommended time: **6 hours**

---

**Good luck and happy building!** 🚀
We’re excited to see how you approach designing secure, maintainable, and production-ready smart contract solutions.