// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MyContract - Intermediate test contract
/// @notice Simple message storage with owner controls, events and modifiers.
contract MyContract {
    string private message;
    address public owner;

    event MessageUpdated(address indexed updater, string newMessage);
    event MessageReset(address indexed owner, string oldMessage);

    /// @notice Message entry struct
    /// @dev Message entry struct contains the message id, content, sender and timestamp
    struct MessageEntry {
        uint256 id;         // message id - auto increment id
        string content;     // message content
        address sender;     // message sender
        uint256 timestamp;  // message timestamp
    }

    mapping(uint256 => MessageEntry) private messages; // mapping of message id to message entry
    uint256 private messageCounter;

    event MessageAdded(uint256 indexed messageId, address indexed sender, string content, uint256 timestamp);
    event MessageDeleted(uint256 indexed messageId, address indexed deletedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _msg) {
        message = _msg;
        owner = msg.sender;
    }

    function setMessage(string calldata _msg) public {
        message = _msg;
        emit MessageUpdated(msg.sender, _msg);
    }

    function getMessage() public view returns (string memory) {
        return message;
    }

    /// @notice Owner-only convenience function
    function resetMessage() public onlyOwner {
        string memory old = message;
        message = "";
        emit MessageReset(msg.sender, old);
    }

    /// @notice Transfer ownership — owner only
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Zero address");
        require(newOwner != owner, "New owner is the same as the current owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /// @notice Modifier to restrict access to the author of the message or the contract owner
    /// @dev Checks if the sender is either the author of the message or the contract owner
    /// @param _id The ID of the message
    modifier onlyAuthorOrOwner(uint256 _id) {
        require(
            messages[_id].sender == msg.sender || msg.sender == owner,
            "Not authorized: must be sender or owner"
        );
        _;
    }

    modifier messageExists(uint256 _id) {
        require(messages[_id].sender != address(0), "Message does not exist");
        _;
    }

    /// @notice Add a new message
    /// @param _content The content of the message
    /// @dev Content will be validated on backend with express-validator and maximum characters
    function addUserMessage(string calldata _content) public {
        uint256 newMessageId = ++messageCounter;
        messages[newMessageId] = MessageEntry({
            id: newMessageId,
            content: _content,
            sender: msg.sender,
            timestamp: block.timestamp
        });
        emit MessageAdded(messageCounter, msg.sender, _content, block.timestamp);
    }

    /// @notice Get a message by ID
    /// @param _id The ID of the message
    /// @return MessageEntry struct containing message details
    function getUserMessage(uint256 _id) public view messageExists(_id) returns (MessageEntry memory) {
        return messages[_id];
    }

    /// @notice Delete a message
    /// @param _id The ID of the message
    /// @dev Delete message will check if the message has not been deleted
    function deleteUserMessage(uint256 _id) public onlyAuthorOrOwner(_id) messageExists(_id) {
        delete messages[_id];
        emit MessageDeleted(_id, msg.sender);
    }
}
