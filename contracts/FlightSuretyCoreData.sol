pragma solidity ^0.4.25;

import "./FlightSuretyCore.sol";

contract FlightSuretyCoreData is FlightSuretyCore {
    mapping(address => uint256) private authorizedContracts;

    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not authorized to do this");
        _;
    }

    function authorizeContract(address contractAddress) external requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeContract(address contractAddress) external requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }
}