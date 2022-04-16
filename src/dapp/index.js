
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let contract = new Contract('localhost', () => {

        displayAirlines(contract);
        displayFlights();
        
        // Read transaction
        contract.isOperational((error, result) => {
            //console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        DOM.elid('register-airline-button').addEventListener('click', () => {
            const airlineAddress = DOM.elid('register-airline-address').value;
            contract.registerAirline(airlineAddress, (error, result) => {
                console.log(error,result);
                if(!error) {
                    addAirlineToTable('New Airline', airlineAddress);
                }
            })
        });

        DOM.elid('fund-airline-button').addEventListener('click', () => {
            const amount = DOM.elid('fund-ether-amount').value; 
            contract.fundAirline(contract.metamaskAccount, amount, (error, result) => {
                console.log(error,result);
            })
        })

        DOM.elid('register-flight-button').addEventListener('click', () => {
            const airlineAddress = DOM.elid('airline-address').value;
            const flightName = DOM.elid('flight-name').value;
            const flightDate = (new Date(DOM.elid('flight-date').value)).getTime();

            contract.registerFlight(airlineAddress, flightName, flightDate, 
                (error, result) => {
                    console.log(error, result);
                    if(!error) {
                        addFlightToTable(airlineAddress, flightName, flightDate);
                    }
            })
        })
    
        function displayAirlines(contract) {
            let displayDiv = DOM.elid('airlines-table');
        
            let headerRow = DOM.tr();
            headerRow.appendChild(DOM.td('Name'));
            headerRow.appendChild(DOM.td('Address'));
        
            displayDiv.appendChild(headerRow);
        
            contract.airlines.forEach((airline, index) => {
                contract.isAirlineRegister(airline, (error, result) => {
                    //console.log(error,result);
                    if(result) { // Airline is registered
                        addAirlineToTable('Airline ' + (index + 1), airline)
                    } 
                })
            })
        }
        
        function displayFlights() {
            let table = DOM.elid('flights-table');
            let headerRow = DOM.tr();
            headerRow.appendChild(DOM.td('Airline'));
            headerRow.appendChild(DOM.td('Number'));
            headerRow.appendChild(DOM.td('Date'));
            headerRow.appendChild(DOM.td('Actions'));
        
            table.appendChild(headerRow);
        }
        
        function display(title, description, results) {
            let displayDiv = DOM.elid("display-wrapper");
            let section = DOM.section();
            section.appendChild(DOM.h2(title));
            section.appendChild(DOM.h5(description));
            results.map((result) => {
                let row = section.appendChild(DOM.div({className:'row'}));
                row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
                row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
                section.appendChild(row);
            })
            displayDiv.append(section);
        
        }
        
        function addFlightToTable(airline, name, date) {
            let table = DOM.elid('flights-table');
            let row = DOM.tr();
            row.appendChild(getCellForAddress(airline));
            row.appendChild(DOM.td(name));
            row.appendChild(DOM.td(date));

            let cell = DOM.td();

            cell.appendChild(DOM.input({
                id: `${airline}-${name}-insurance-amount}`,
                type: 'number',
            }));

            cell.appendChild(DOM.span('In Finneys'))

            cell.appendChild(createCellButton('btn btn-primary btn-sm', 'Buy insurance', 
            () => {
                contract.buyInsurance(airline, name, date, DOM.elid(`${airline}-${name}-insurance-amount}`).value, (error, result) => {
                    console.log(error,result);
                })
            }));

            cell.appendChild(createCellButton('btn btn-primary btn-sm', 'Send to Oracle', 
            () => {
                contract.fetchFlightStatus(airline, name, date, (error, result) => {
                    display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
                });
            }));

            cell.appendChild(createCellButton('btn btn-primary btn-sm', 'Receive Money', 
            () => {
                contract.payInsuree(airline, name, date, (error, result) => {
                    console.log(error,result);
                })
            }));
        
            row.appendChild(cell);
            table.appendChild(row);
        }
        
        function addAirlineToTable(name, address) {
            let table = DOM.elid('airlines-table');
            let row = DOM.tr();
            row.appendChild(DOM.td(name));
            row.appendChild(getCellForAddress(address));
            table.appendChild(row);
        }
        
        function beautifyAddress(address) {
            return '...' + address.substring(address.length - 6);
        }
        
        function getCellForAddress(address){
            let button = DOM.button({
                className: 'btn btn-info btn-sm'
            }, 'Copy');
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(address);
            });
        
            let cell = DOM.td();
            cell.appendChild(DOM.span(beautifyAddress(address)));
            cell.appendChild(button);
        
            return cell;
        }

        function createCellButton(className, text, clickAction){
            let button = DOM.button({
                className: className
            }, text);
            button.addEventListener('click', clickAction);

            return button;
        }
    });

})();