pragma solidity ^0.4.25;

import "../../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyCore {
    using SafeMath for uint256;

    // Flight status codees
    uint8 internal constant STATUS_CODE_UNKNOWN = 0;
    uint8 internal constant STATUS_CODE_ON_TIME = 10;
    uint8 internal constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 internal constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 internal constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 internal constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;
    bool private operational = true;  
    uint256 private entrancyCounter = 1;

    constructor() public 
    {
        contractOwner = msg.sender;
    }

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _; 
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier entrancyGuard()
    {
        entrancyCounter = entrancyCounter.add(1);
        uint256 guard = entrancyCounter;
        _;
        require(guard == entrancyCounter, "Cannot make same call twice");
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus(bool mode) external requireContractOwner 
    {
        operational = mode;
    }

}