import { selectionSet } from '../../main.js';

// Variable for data
let cachedData = null;

// Move attributeColors to the top level scope
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
    'El': 'blue'
};

// Function to create or update a Plotly stacked bar graph
function createOrUpdatePlotlyGraph(data, selectedForsyids) {
    const graphContainer = document.getElementById('graph-container');

    if (!selectedForsyids || selectedForsyids.length === 0) {
        console.error('No forsyid selected');
        if (graphContainer.data && graphContainer.data.length > 0) {
            Plotly.purge(graphContainer);
        }
        return;
    }

    const attributes = [
        'Kul', 'Olie', 'Gas', 'Affald (fossil)', 'Halm', 'Skovflis', 'Brænde', 'Træpiller', 'Træaffald', 'Affald (bio)',
        'Biobrændsler (bioolie)', 'Biogas', 'Overskudsvarme', 'Solvarme', 'Varmepumper'
    ];

    // Filter out forsyids with no data
    const validForsyids = selectedForsyids.filter(forsyid => {
        const forsyidData = data[forsyid];
        return forsyidData && Object.keys(forsyidData.production).length > 0;
    });

    if (validForsyids.length === 0) {
        console.warn('No valid data found for selected plants');
        showToast("No data available for the selected plant(s)");
        Plotly.purge(graphContainer);
        return;
    }

    const traces = attributes.map(attr => {
        const x = [];
        const y = [];

        validForsyids.forEach(forsyid => {
            const forsyidData = data[forsyid];
            if (forsyidData) {
                x.push(forsyidData.name);
                const years = Object.keys(forsyidData.production);
                const value = years.reduce((sum, year) => sum + (forsyidData.production[year][attr] || 0), 0);
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
        title: 'Production for Selected Plants',
        xaxis: { title: 'Plants' },
        yaxis: { title: 'Production (GJ)' },
        barmode: 'stack'
    };

    Plotly.react(graphContainer, traces, layout);
}

function createSinglePlantGraph(data, forsyid, focus) {
    const graphContainer = document.getElementById('graph-container');
    const plantData = data[forsyid];
    
    if (!plantData) {
        console.error(`No data found for forsyid ${forsyid}`);
        showToast("No data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    // Check if there's any production data
    if (!plantData.production || Object.keys(plantData.production).length === 0) {
        console.error(`No production data found for forsyid ${forsyid}`);
        showToast("No production data available for the selected plant");
        Plotly.purge(graphContainer);
        return;
    }

    const years = ['2020', '2021', '2022'];
    const attributes = [
        'Kul', 'Olie', 'Gas', 'Affald (fossil)', 'Halm', 'Skovflis', 'Brænde', 
        'Træpiller', 'Træaffald', 'Affald (bio)', 'Biobrændsler (bioolie)', 
        'Biogas', 'Overskudsvarme', 'Solvarme', 'El'
    ];

    const traces = attributes.map(attr => ({
        x: years,
        y: years.map(year => plantData.production[year]?.[attr] || 0),
        type: 'scatter',
        mode: 'lines',
        stackgroup: 'one',
        name: attr,
        fill: 'tonexty',
        line: {
            width: 0.5,
            color: attributeColors[attr]
        },
        fillcolor: attributeColors[attr]
    }));

    const layout = {
        title: `Production Over Time - ${plantData.name}`,
        xaxis: {
            title: 'Time (Year)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4'
        },
        yaxis: {
            title: 'Production (GJ)',
            showgrid: true,
            gridwidth: 1,
            gridcolor: '#E4E4E4',
            rangemode: 'tozero'
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        hovermode: 'x unified',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white'
    };

    Plotly.react(graphContainer, traces, layout);
}

// New function to determine which graph to display
function navigateGraphs(data, selectedForsyids, focus) {
    const graphContainer = document.getElementById('graph-container');
    
    if (!selectedForsyids || selectedForsyids.length === 0) {
        console.error('No forsyid selected');
        if (graphContainer.data && graphContainer.data.length > 0) {
            Plotly.purge(graphContainer);
        }
        return;
    }

    // Choose graph type based on selection count
    if (selectedForsyids.length === 1) {
        createSinglePlantGraph(data, selectedForsyids[0], focus);
    } else {
        createOrUpdatePlotlyGraph(data, selectedForsyids);
    }
}

// Modified update function to include focus parameter
function updateGraph(focus = 'production') {
    if (cachedData) {
        const selectedForsyids = Array.from(selectionSet);
        navigateGraphs(cachedData, selectedForsyids, focus);
    } else {
        fetch('../../data/data_dict.json')
            .then(response => response.json())
            .then(data => {
                cachedData = data;
                const selectedForsyids = Array.from(selectionSet);
                navigateGraphs(cachedData, selectedForsyids, focus);
            })
            .catch(error => console.error('Error loading data:', error));
    }
}

// Export the updateGraph function for use in other modules
export { updateGraph };

// Initial graph creation based on the selectionSet
updateGraph();

// Add this function at the top of the file
function showToast(message) {
    // Get the map container element
    const mapContainer = document.getElementById('map');
    // Get the position and dimensions of the map container
    const mapRect = mapContainer.getBoundingClientRect();
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "#ff4444",
            borderRadius: "5px",
            position: "absolute",  // Changed from fixed to absolute
            top: `${mapRect.top + 10}px`,  // 10px padding from top of map
            right: `${window.innerWidth - mapRect.right + 10}px`,  // 10px padding from right of map
            zIndex: 9999
        },
        offset: {
            x: 0,
            y: 0
        }
    }).showToast();
}