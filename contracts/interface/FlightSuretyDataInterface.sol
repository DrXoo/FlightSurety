pragma solidity ^0.4.25;

contract FlightSuretyDataInterface {
    function registerAirline(address newAirline) external;
    function getRegistrationStatus(address possibleNewAirline) external returns(bool success, uint256 votes);
    function addFlight(address airline, bytes32 flightKey) external;
    function creditInsurees(bytes32 flightKey) external;
}
