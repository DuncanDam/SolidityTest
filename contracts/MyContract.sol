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
    mapping(address => uint256[]) private userMessages; // mapping of user address to array of message ids
    uint256 private messageCounter;

    event MessageAdded(uint256 indexed messageId, address indexed sender, string content, uint256 timestamp);
    event MessageDeleted(uint256 indexed messageId, address indexed deletedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _msg) {
        require(bytes(_msg).length > 0, "Message cannot be empty");
        message = _msg;
        owner = msg.sender;
    }

    function setMessage(string memory _msg) public {
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
    function addMessage(string calldata _content) public {
        uint256 newMessageId = ++messageCounter;
        messages[newMessageId] = MessageEntry({
            id: newMessageId,
            content: _content,
            sender: msg.sender,
            timestamp: block.timestamp
        });
        userMessages[msg.sender].push(newMessageId);
        emit MessageAdded(messageCounter, msg.sender, _content, block.timestamp);
    }

    /// @notice Get a message by ID
    /// @param _id The ID of the message
    /// @dev Get message by ID will check if the message has been deleted
    /// @return The message by id
    function getMessageById(uint256 _id) public view messageExists(_id) returns (MessageEntry memory) {
        return messages[_id];
    }

    /// @notice Delete a message
    /// @param _id The ID of the message
    /// @dev Delete message will check if the message has not been deleted and remove from user's message array
    function deleteMessage(uint256 _id) public onlyAuthorOrOwner(_id) messageExists(_id) {
        address messageSender = messages[_id].sender;

        // Delete from messages mapping
        delete messages[_id];

        // Remove from userMessages array
        uint256[] storage userMsgIds = userMessages[messageSender];
        for (uint256 i = 0; i < userMsgIds.length; i++) {
            if (userMsgIds[i] == _id) {
                // Swap with last element
                userMsgIds[i] = userMsgIds[userMsgIds.length - 1];
                // Remove last element
                userMsgIds.pop();
                break;
            }
        }

        emit MessageDeleted(_id, msg.sender);
    }

    /// @notice Get all messages by user
    /// @param _user The address of the user
    /// @dev Get user messages will check if the user has messages
    function getUserMessages(address _user) public view returns (MessageEntry[] memory) {
        uint256[] memory userMessageIds = userMessages[_user];
        MessageEntry[] memory userMsgs = new MessageEntry[](userMessageIds.length);
        for (uint256 i = 0; i < userMessageIds.length; i++) {
            userMsgs[i] = messages[userMessageIds[i]];
        }
        return userMsgs;
    }

    /// @notice Get messages by user with pagination
    /// @param _user The address of the user
    /// @param _start Starting index (lower bound if !_reverse, upper bound if _reverse)
    /// @param _limit Maximum messages to return
    /// @param _reverse If true, return messages in reverse order (newest first)
    /// @return returnMessages Array of messages
    /// @return hasNext True if there are more messages to fetch
    /// @return nextIndex Next index for pagination (only valid if hasNext is true)
    /// @return total Total number of messages for the user
    function getUserMessagesRange(address _user, uint256 _start, uint256 _limit, bool _reverse)
        public view returns (MessageEntry[] memory returnMessages, bool hasNext, uint256 nextIndex, uint256 total)
    {
        uint256[] memory userMessageIds = userMessages[_user];
        total = userMessageIds.length;

        // If there are no messages, return empty array
        if (total == 0) return (new MessageEntry[](0), false, 0, 0);

        // Normalize _start based on direction
        if (_reverse) {
            _start = _start >= total ? total - 1 : _start;
        } else {
            require(_start < total, "Start index out of bounds");
        }

        // Calculate range
        uint256 count;
        uint256 rangeStart;

        if (_reverse) {
            count = _start + 1 < _limit ? _start + 1 : _limit;
            rangeStart = _start + 1 - count;
        } else {
            count = _start + _limit > total ? total - _start : _limit;
            rangeStart = _start;
        }

        // Populate results
        returnMessages = new MessageEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 index = _reverse ? _start - i : rangeStart + i;
            returnMessages[i] = messages[userMessageIds[index]];
        }

        // Set pagination state
        hasNext = _reverse ? rangeStart > 0 : rangeStart + count < total;
        nextIndex = _reverse ? rangeStart - 1 : rangeStart + count;
    }

    /// @notice Get the total number of messages
    /// @dev Get message count will return the total number of messages (not including deleted messages)
    /// @return The total number of messages
    function getMessageCount() public view returns (uint256) {
        return messageCounter;
    }
}
