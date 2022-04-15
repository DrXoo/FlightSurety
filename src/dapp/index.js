
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let contract = new Contract('localhost', () => {

        displayAirlines(contract);
        displayRandomFlights();
        
        // Read transaction
        contract.isOperational((error, result) => {
            //console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        DOM.elid('register-airline-button').addEventListener('click', () => {
            const airlineAddress = DOM.elid('register-airline-address').value;
            
            let table = DOM.elid('airlines-table');
            addAirlineToTable(table, 'New Airline', airlineAddress);
        });
    
        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    
    });
    

})();

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
                addAirlineToTable(displayDiv, 'Airline ' + (index + 1), airline)
            } 
        })
    })
}

function addAirlineToTable(tableDiv, name, address) {
    let row = DOM.tr();
    row.appendChild(DOM.td(name));
    
    row.appendChild(DOM.td(beautifyAddress(address)));
    let button = DOM.button({
        className: 'btn btn-light'
    }, 'Copy');
    button.addEventListener('click', () => {
        navigator.clipboard.writeText(address);
    });
    row.appendChild(button);
    tableDiv.appendChild(row);
}

function displayRandomFlights() {
    let displayDiv = DOM.elid('flights-table');
    let headerRow = DOM.tr();
    headerRow.appendChild(DOM.td('Number'));
    headerRow.appendChild(DOM.td('Date'));
    headerRow.appendChild(DOM.td('Actions'));

    displayDiv.appendChild(headerRow);

    Array.from(Array(5).keys()).forEach(element => {
        let exampleRow = DOM.tr();
        const flight = getRandomFlight();
        exampleRow.appendChild(DOM.td(flight[0]));
        exampleRow.appendChild(DOM.td(flight[1]));
        exampleRow.appendChild(DOM.td(DOM.button({ className: 'btn btn-primary'}, 'Buy insurance')));
        displayDiv.appendChild(exampleRow);
    });
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

function getRandomFlight() {
    var id = "";
    const characters = 'ABCDEFGHIJKLMNIOPQRSTUVWXYZ';
    Array.from(Array(4).keys()).forEach(x => {
        id+=characters.charAt(Math.floor(Math.random() * characters.length));
    });

    Array.from(Array(3).keys()).forEach(x => {
        id+=Math.floor(Math.random() * 10);
    });

    var date = new Date(Date.now() + Math.floor(Math.random() * 100000) * Math.floor(Math.random() * 100000))

    return [id, date.toDateString()];
}

function beautifyAddress(address) {
    return '...' + address.substring(address.length - 6);
}