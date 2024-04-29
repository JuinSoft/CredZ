// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract CreditScoreManager {
    // Mapping of address to credit score
    mapping(address => uint256) private creditScores;

    // Mapping to track last update timestamp by address
    mapping(address => uint256) private lastUpdate;

    // Minimum interval for credit score updates by the same address
    uint256 private constant UPDATE_INTERVAL = 30 days;

    // Authorized contract address
    address private constant authorizedContract = 0x124...; // Complete with the actual address

    // Event to emit credit score updates
    event CreditScoreUpdated(address indexed user, uint256 newScore);

    // Modifier to check update interval
    modifier canUpdate() {
        require(
            block.timestamp >= lastUpdate[msg.sender] + UPDATE_INTERVAL,
            "Credit score can only be updated once every 30 days"
        );
        _;
    }

    // Modifier to restrict access to the authorized contract
    modifier onlyAuthorizedContract() {
        require(msg.sender == authorizedContract, "Caller is not the authorized contract");
        _;
    }

    // Function to update own credit score
    function updateCreditScore(uint256 _newScore) external canUpdate {
        creditScores[msg.sender] = _newScore;
        lastUpdate[msg.sender] = block.timestamp;
        emit CreditScoreUpdated(msg.sender, _newScore);
    }

    // Function for the authorized contract to update credit score
    function updateCreditScoreForUser(address _user, uint256 _newScore) external onlyAuthorizedContract {
        creditScores[_user] = _newScore;
        lastUpdate[_user] = block.timestamp;
        emit CreditScoreUpdated(_user, _newScore);
    }

    // Function to get credit score of an address
    function getCreditScore(address _user) external view returns (uint256) {
        return creditScores[_user];
    }
}
