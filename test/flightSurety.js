
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
                
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try 
        {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
        
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try 
        {
            await config.flightSurety.setTestingMode(true);
        }
        catch(e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
        
        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        }
        catch(e) {
        }
        let result = await config.flightSuretyData.isAirline.call(newAirline); 

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('(airline) An Airline can be registered if the airline caller has enough funds', async () => {
        
        // ARRANGE
        let newAirline = accounts[2];

        await provideFunds(config.flightSuretyData, config.firstAirline);

        // ACT
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});

        let result = await config.flightSuretyData.isAirline.call(newAirline); 

        // ASSERT
        assert.equal(result, true);
    });

    it('(airline) Airlines can be registered without voting system until there are 4 airlines registered', async () => {
        
        // ARRANGE
        const thirdAirline = accounts[3];
        const forthAirline = accounts[4];
        const fifthAirline = accounts[5];

        await provideFunds(config.flightSuretyData, config.firstAirline);

        // ACT
        await config.flightSuretyApp.registerAirline(thirdAirline, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(forthAirline, {from: config.firstAirline});
        const result = await config.flightSuretyApp.registerAirline.call(fifthAirline, {from: config.firstAirline});
        
        // ASSERT
        assert.equal( await config.flightSuretyData.isAirline.call(thirdAirline), true);
        assert.equal( await config.flightSuretyData.isAirline.call(forthAirline), true);
        assert.equal( result[0], false);
        assert.equal( result[1], 1); // Now Fifth Airline has one vote from firstAirline
        
    });

    it('(airline) Airlines must pass a vote process to register after the fifth', async () => {
        // ARRANGE
        const secondAirline = accounts[2];
        const thirdAirline = accounts[3];
        const forthAirline = accounts[4];

        const newAirline = accounts[5];

        await provideFunds(config.flightSuretyData, secondAirline);
        await provideFunds(config.flightSuretyData, thirdAirline);
        await provideFunds(config.flightSuretyData, forthAirline);

        // ACT    
        await config.flightSuretyApp.registerAirline(newAirline, {from: secondAirline});
        await config.flightSuretyApp.registerAirline(newAirline, {from: thirdAirline});
        const result = await config.flightSuretyApp.registerAirline.call(newAirline, {from: forthAirline});

        // ASSERT
        assert.equal(result[0], true);
    });

    const provideFunds = async(contract, address) => {
        const minnimumFunds = await config.flightSuretyData.AIRLINE_FUNDS_MINNIMUM.call();
        const isRegistered = await contract.isAirline.call(address);
        if(isRegistered) {
            await web3.eth.sendTransaction({
                from: address,
                to: contract.address,
                value: minnimumFunds
            });
        } else {
            throw "Address must be registered first";
        }
    }

});
