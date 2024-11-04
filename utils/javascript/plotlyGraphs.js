import { selectionSet } from '../../main.js';

// Variable for data
let cachedData = null;

// Function to create or update a Plotly graph
function createOrUpdatePlotlyGraph(data, selectedForsyids) {
    const graphContainer = document.getElementById('graph-container');

    if (!selectedForsyids || selectedForsyids.length === 0) {
        console.error('No forsyid selected');
        // Clear the graph if it exists
        if (graphContainer.data && graphContainer.data.length > 0) {
            Plotly.purge(graphContainer);
        }
        return;
    }

    const traces = selectedForsyids.map(forsyid => {
        const forsyidData = data[forsyid];

        if (!forsyidData) {
            console.warn(`No data found for forsyid ${forsyid}`);
            return {
                x: [],
                y: [],
                type: 'scatter',
                name: `Forsyid ${forsyid} (No Data)`
            };
        }

        const years = Object.keys(forsyidData.data);
        const values = years.map(year => forsyidData.data[year]['CO2 - El&Varme']); // Use the actual key 'CO2 - El&Varme'

        return {
            x: years,
            y: values,
            type: 'scatter',
            name: forsyidData.name // Use the name from the data
        };
    });

    const layout = {
        title: 'Data for Selected Forsyids',
        xaxis: { title: 'Year' },
        yaxis: { title: 'CO2 - El&Varme' } // Update the y-axis title
    };

    Plotly.react(graphContainer, traces, layout);
}

// Function to update the graph based on the current selection
function updateGraph() {
    if (cachedData) {
        // Use the cached data to update the graph
        const selectedForsyids = Array.from(selectionSet);
        createOrUpdatePlotlyGraph(cachedData, selectedForsyids);
    } else {
        // Fetch the data and cache it
        fetch('../../data/data_dict.json')
            .then(response => response.json())
            .then(data => {
                cachedData = data;
                const selectedForsyids = Array.from(selectionSet);
                createOrUpdatePlotlyGraph(cachedData, selectedForsyids);
            })
            .catch(error => console.error('Error loading data:', error));
    }
}

// Export the updateGraph function for use in other modules
export { updateGraph };

// Initial graph creation based on the selectionSet
updateGraph();