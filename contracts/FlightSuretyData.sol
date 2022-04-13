pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./core/FlightSuretyCoreData.sol";

contract FlightSuretyData is FlightSuretyCoreData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 public constant REGISTRATION_MULTIPARTY_THRESHOLD = 4;
    //uint256 private constant AMOUNT_MULTIPLIER = 1.5;

    struct Insurance {
        bool isActive;
        uint256 amount;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
        mapping(address => Insurance) insurances;
    }

    struct Airline {    
        bool isRegistered;  
        uint256 funds;
    }

    mapping(bytes32 => Flight) private flights;

    mapping(address => Airline) private airlines;
    uint256 private airlinesLength = 0;

    address[] airlineVotes = new address[](0);

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public 
    {
        // Make the contract owner be the first airline to register
        _addAirline(msg.sender);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier isExternalCallerRegistered() {
        require(airlines[tx.origin].isRegistered);
        _;
    }

    modifier isSenderNotAContract() {
        require(tx.origin == msg.sender, "Contract cannot make this operation");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address newAirline) requireIsOperational requireIsCallerAuthorized isExternalCallerRegistered entrancyGuard external 
    {
        require(!airlines[newAirline].isRegistered); // Not to register an already register airline

        if(airlinesLength <= REGISTRATION_MULTIPARTY_THRESHOLD) 
        {
            // Continue register without limits until threshold
            _addAirline(newAirline);
        } 
        else if(airlineVotes.length < airlinesLength.div(2))
        {
            // Each airline will vote to register until at least 50% of already registered airlines call this method
            require(!_isElementInArray(airlineVotes, tx.origin), "Airline cannot vote twice to register");
            
            airlineVotes.push(tx.origin);
        }
        else 
        {
            // Finally, register the airline
            _addAirline(newAirline);
            // Reset vote count for next time
            airlineVotes = new address[](0);  
        }
    }

    function getRegistrationStatus(address possibleNewAirline) requireIsOperational requireIsCallerAuthorized isExternalCallerRegistered external view returns(bool success, uint256 votes)
    {
        return (airlines[possibleNewAirline].isRegistered, airlineVotes.length);
    }

    function addFlight(address airline, bytes32 flightKey) requireIsOperational requireIsCallerAuthorized isExternalCallerRegistered external
    {
        require(!flights[flightKey].isRegistered, "Flight already registered");

        flights[flightKey] = Flight({
            isRegistered: true,
            statusCode: STATUS_CODE_ON_TIME,
            updatedTimestamp: block.timestamp,
            airline: airline
        });
    }

    /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(bytes32 flightKey) isSenderNotAContract external payable
    {
        require(flights[flightKey].insurances[msg.sender].isActive == false, "You already have an insurance for this flight");

        flights[flightKey].insurances[msg.sender] = Insurance({
            isActive: true,
            amount: msg.value
        }); 
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightKey) requireIsCallerAuthorized external 
    {
        require(flights[flightKey].statusCode == STATUS_CODE_ON_TIME, "Cannot change status if it is not 'ON_TIME'");

        flights[flightKey].statusCode = STATUS_CODE_LATE_AIRLINE;
        flights[flightKey].updatedTimestamp = block.timestamp;
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(bytes32 flightKey) isSenderNotAContract entrancyGuard external
    {
        require(flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE, "Cannot receive funds for this flight");
        require(flights[flightKey].insurances[msg.sender].isActive, "This insurance is not active anymore");

        uint256 amount = flights[flightKey].insurances[msg.sender].amount;

        flights[flightKey].insurances[msg.sender].amount = 0;
        flights[flightKey].insurances[msg.sender].isActive = false;

        address(msg.sender).transfer(amount.mul(15) / 10);
    }

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund() requireIsOperational requireIsCallerAuthorized isExternalCallerRegistered public payable
    {
        airlines[tx.origin].funds = airlines[tx.origin].funds.add(msg.value);
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) pure internal returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable 
    {
        fund();
    }

    function _addAirline(address newAirline) private {
        airlines[newAirline] = Airline({
            isRegistered: true,
            funds: 0
        });
        airlinesLength = airlinesLength.add(1);
    }

    function _isElementInArray(address[] array, address element) private pure returns(bool){
        bool result = false;
        for(uint c = 0; c < array.length; c++) {
            if (array[c] == element) {
                result = true;
                break;
            }
        }

        return result;
    }
}

