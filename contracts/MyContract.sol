// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MyContract - Intermediate test contract
/// @notice Simple message storage with owner controls, events and modifiers.
contract MyContract {
    string private message;
    address public owner;

    event MessageUpdated(address indexed updater, string newMessage);
    event MessageReset(address indexed owner, string oldMessage);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _msg) {
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
        owner = newOwner;
    }
}
