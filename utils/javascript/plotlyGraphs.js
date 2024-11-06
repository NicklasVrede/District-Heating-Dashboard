import { selectionSet } from '../../main.js';

// Variable for data
let cachedData = null;

// Function to create or update a Plotly stacked bar graph
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

    const attributes = [
        'Kul', 'Olie', 'Gas', 'Affald (fossil)', 'Halm', 'Skovflis', 'Brænde', 'Træpiller', 'Træaffald', 'Affald (bio)',
        'Biobrændsler (bioolie)', 'Biogas', 'Overskudsvarme', 'Solvarme', 'El', 'andel kraftvarme', 'andel kedler'
    ];

    const attributeColors = {
        'Kul': 'black',
        'Olie': 'brown',
        'Gas': 'gray',
        'Affald (fossil)': 'darkred',
        'Halm': 'yellow',
        'Skovflis': 'green',
        'Brænde': 'saddlebrown',
        'Træpiller': 'peru',
        'Træaffald': 'darkorange',
        'Affald (bio)': 'lightgreen',
        'Biobrændsler (bioolie)': 'olive',
        'Biogas': 'lime',
        'Overskudsvarme': 'red',
        'Solvarme': 'gold',
        'El': 'blue',
        'andel kraftvarme': 'purple',
        'andel kedler': 'pink'
    };

    const traces = attributes.map(attr => {
        const x = [];
        const y = [];

        selectedForsyids.forEach(forsyid => {
            const forsyidData = data[forsyid];

            if (!forsyidData) {
                console.warn(`No data found for forsyid ${forsyid}`);
                x.push(`Forsyid ${forsyid} (No Data)`);
                y.push(0);
            } else {
                x.push(forsyidData.name);
                const years = Object.keys(forsyidData.data);
                const value = years.reduce((sum, year) => sum + (forsyidData.data[year][attr] || 0), 0);
                y.push(value);
            }
        });

        return {
            x: x,
            y: y,
            type: 'bar',
            name: attr,
            marker: { color: attributeColors[attr] }
        };
    });

    const layout = {
        title: 'Data for Selected Forsyids',
        xaxis: { title: 'Plants' },
        yaxis: { title: 'Values' },
        barmode: 'stack'
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