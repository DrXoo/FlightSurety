pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyCoreData.sol";

contract FlightSuretyData is FlightSuretyCoreData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 public constant REGISTRATION_MULTIPARTY_THRESHOLD = 4;

    struct Airline {    
        bool isRegistered;  
        address airline;
        uint256 funds;
    }

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

    /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy() external payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure
    {
        
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure
    {

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
            funds: 0,
            airline: newAirline
        });
        airlinesLength = airlinesLength.add(1);
    }

    function _isElementInArray(address[] array, address element) private returns(bool){
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

