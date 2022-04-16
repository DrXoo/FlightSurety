import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.metamaskAccount = null;
    }

    initialize(callback) {
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask is installed!');
        }

        ethereum.request({ method: 'eth_requestAccounts' })
            .then(result => {
            this.metamaskAccount = result[0];
        }).catch(error => {
            console.log(error);
        });

        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            console.log("Airlines", this.airlines);
            console.log("Passengers", this.passengers);

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    isAirlineRegister(airlineAddress, callback) {
        let self = this;
        self.flightSuretyData.methods
            .isAirline(airlineAddress)
            .call({ from: self.owner}, callback);
    }

    registerAirline(airlineAddress, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airlineAddress)
            .send({ from: self.airlines[0]}, (error, result) => {
                callback(error, airlineAddress);
            })
    }

    registerFlight(airline, flightName, date, callback) {
        let self = this;
        console.log(airline);
        console.log(flightName);
        console.log(date);
        self.flightSuretyApp.methods
            .registerFlight(airline, flightName, date)
            .send({ from: airline}, (error, result) => {
                callback(error, result)
            })
    }

    buyInsurance(airline, flightName, date, amount, callback) {
        let self = this;
        const finneys = this.web3.utils.toWei(amount.toString(), 'finney')
        self.flightSuretyData.methods
            .buy(airline, flightName, date)
            .send({ from: self.passengers[0], finneys}, (error, result) => {
                callback(error, result)
            })
    }

    payInsuree(airline, flightName, date, callback) {
        let self = this;

        self.flightSuretyData.methods
            .pay(airline, flightName, date)
            .send({ from: self.passengers[0]}, (error, result) => {
                callback(error, result)
            })
    }

    fundAirline(from ,amount, callback) {
        let self = this;
        self.flightSuretyData.methods
            .fund()
            .send( { from: from, value: this.web3.utils.toWei(amount.toString(), 'ether') }, 
            (error, result) => {
                callback(error, result)
            });
    }

    fetchFlightStatus(airline, flightName, flightDate, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flightName,
            timestamp: flightDate
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flightName, flightDate)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}