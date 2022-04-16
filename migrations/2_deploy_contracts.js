const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async function(deployer) {

    const accounts = await web3.eth.getAccounts();
    
    await deployer.deploy(FlightSuretyData, accounts[1]);

    var flightSuretyData = await FlightSuretyData.deployed();

    await deployer.deploy(FlightSuretyApp, flightSuretyData.address)

    var flightSuretyApp = await FlightSuretyApp.deployed();

    flightSuretyData.authorizeContract(flightSuretyApp.address);

    const config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: flightSuretyData.address,
            appAddress: flightSuretyApp.address 
        }
    }

    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
}