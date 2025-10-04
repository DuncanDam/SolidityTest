const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyContract - Comprehensive Test Suite", function() {
  let contract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("MyContract");
    contract = await Contract.deploy("Initial message");
    await contract.waitForDeployment();
  });

  describe("Deployment", function() {
    it("Should set the initial message and owner correctly", async function() {
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.getMessage()).to.equal("Initial message");
    });
  });

  describe("Basic Message Management", function() {
    it("Should allow anyone to set message", async function() {
      await contract.connect(addr1).setMessage("Message from addr1");
      expect(await contract.getMessage()).to.equal("Message from addr1");
    });

    it("Should emit MessageUpdated event when setting message", async function() {
      await expect(contract.connect(addr1).setMessage("New message"))
        .to.emit(contract, "MessageUpdated")
        .withArgs(addr1.address, "New message");
    });

    it("Should allow owner to reset message", async function() {
      await contract.connect(owner).setMessage("Test message");
      await contract.connect(owner).resetMessage();
      expect(await contract.getMessage()).to.equal("");
    });

    it("Should emit MessageReset event when resetting", async function() {
      await contract.connect(owner).setMessage("Test message");
      await expect(contract.connect(owner).resetMessage())
        .to.emit(contract, "MessageReset")
        .withArgs(owner.address, "Test message");
    });

    it("Should prevent non-owner from resetting message", async function() {
      await expect(
        contract.connect(addr1).resetMessage()
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("User Message System", function() {
    it("Should add user message and emit event with correct data", async function() {
      const tx = await contract.connect(addr1).addUserMessage("Hello World");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "MessageAdded";
        } catch {
          return false;
        }
      });
      expect(event).to.not.be.undefined;

      const parsed = contract.interface.parseLog(event);
      expect(parsed.args.messageId).to.equal(1);
      expect(parsed.args.sender).to.equal(addr1.address);
      expect(parsed.args.content).to.equal("Hello World");
    });

    it("Should retrieve user message by ID", async function() {
      await contract.connect(addr1).addUserMessage("Test message");

      const message = await contract.getUserMessage(1);
      expect(message.id).to.equal(1);
      expect(message.content).to.equal("Test message");
      expect(message.sender).to.equal(addr1.address);
      expect(message.timestamp).to.be.gt(0);
    });

    it("Should auto-increment message IDs", async function() {
      await contract.connect(addr1).addUserMessage("First");
      await contract.connect(addr2).addUserMessage("Second");
      await contract.connect(addr1).addUserMessage("Third");

      const msg1 = await contract.getUserMessage(1);
      const msg2 = await contract.getUserMessage(2);
      const msg3 = await contract.getUserMessage(3);

      expect(msg1.id).to.equal(1);
      expect(msg2.id).to.equal(2);
      expect(msg3.id).to.equal(3);
    });

    it("Should revert when getting non-existent message", async function() {
      await expect(
        contract.getUserMessage(999)
      ).to.be.revertedWith("Message does not exist");
    });

    it("Should revert when getting deleted message", async function() {
      const tx = await contract.connect(addr1).addUserMessage("To be deleted");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "MessageAdded";
        } catch {
          return false;
        }
      });
      const messageId = contract.interface.parseLog(event).args.messageId;

      await contract.connect(addr1).deleteUserMessage(messageId);

      await expect(
        contract.getUserMessage(messageId)
      ).to.be.revertedWith("Message does not exist");
    });
  });

  describe("Access Control Tests", function() {
    it("Only message author can delete their message", async function() {
      // addr1 creates a message
      const tx1 = await contract.connect(addr1).addUserMessage("addr1 message");
      const receipt1 = await tx1.wait();

      // Get message ID from event
      const event1 = receipt1.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "MessageAdded";
        } catch {
          return false;
        }
      });
      const messageId = contract.interface.parseLog(event1).args.messageId;

      // addr2 cannot delete addr1's message
      await expect(
        contract.connect(addr2).deleteUserMessage(messageId)
      ).to.be.revertedWith("Not authorized: must be sender or owner");
    });

    it("Contract owner can delete any message", async function() {
      // addr1 creates a message
      const tx1 = await contract.connect(addr1).addUserMessage("addr1 message");
      const receipt1 = await tx1.wait();

      // Get message ID from event
      const event1 = receipt1.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "MessageAdded";
        } catch {
          return false;
        }
      });
      const messageId = contract.interface.parseLog(event1).args.messageId;

      // Owner can delete it
      const tx2 = await contract.connect(owner).deleteUserMessage(messageId);
      const receipt2 = await tx2.wait();

      // Verify deletion event
      const deleteEvent = receipt2.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === "MessageDeleted";
        } catch {
          return false;
        }
      });
      expect(deleteEvent).to.not.be.undefined;
    });
  });

  describe("Ownership Management", function() {
    it("Should transfer ownership successfully", async function() {
      await expect(contract.connect(owner).transferOwnership(addr1.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);

      expect(await contract.owner()).to.equal(addr1.address);
    });

    it("Should prevent transfer to zero address", async function() {
      await expect(
        contract.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Zero address");
    });

    it("Should prevent transfer to same owner", async function() {
      await expect(
        contract.connect(owner).transferOwnership(owner.address)
      ).to.be.revertedWith("New owner is the same as the current owner");
    });

    it("Should prevent non-owner from transferring ownership", async function() {
      await expect(
        contract.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Not owner");
    });

    it("Should allow new owner to use owner functions", async function() {
      await contract.connect(owner).transferOwnership(addr1.address);

      await contract.connect(addr1).setMessage("New owner message");
      await expect(contract.connect(addr1).resetMessage())
        .to.emit(contract, "MessageReset");

      expect(await contract.getMessage()).to.equal("");
    });

    it("Should prevent old owner from using owner functions after transfer", async function() {
      await contract.connect(owner).transferOwnership(addr1.address);

      await expect(
        contract.connect(owner).resetMessage()
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("Integration Test", function() {
    it("Should handle complete workflow correctly", async function() {
      // Verify initial state
      expect(await contract.owner()).to.equal(owner.address);
      expect(await contract.getMessage()).to.equal("Initial message");

      // Add user messages
      const tx1 = await contract.connect(addr1).addUserMessage("Hello from addr1");
      await tx1.wait();
      const tx2 = await contract.connect(addr2).addUserMessage("Hello from addr2");
      await tx2.wait();

      // Verify messages
      const msg1 = await contract.getUserMessage(1);
      const msg2 = await contract.getUserMessage(2);
      expect(msg1.sender).to.equal(addr1.address);
      expect(msg2.sender).to.equal(addr2.address);

      // Update basic message
      await contract.connect(owner).setMessage("Updated message");
      expect(await contract.getMessage()).to.equal("Updated message");

      // Delete message and reset
      await contract.connect(addr1).deleteUserMessage(1);
      await contract.connect(owner).resetMessage();

      expect(await contract.getMessage()).to.equal("");
      await expect(contract.getUserMessage(1)).to.be.revertedWith("Message does not exist");
    });
  });
});
