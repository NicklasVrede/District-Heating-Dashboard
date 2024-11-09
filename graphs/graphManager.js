import { createSinglePlantGraph } from './components/singlePlant.js';
import { createOrUpdatePlotlyGraph } from './components/multiPlant.js';
import { selectionSet } from '../main.js';

// Variable for data caching
let cachedData = null;

// Function to determine which graph to display
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

// Function to update the graph
export function updateGraph(focus = 'production') {
    if (cachedData) {
        const selectedForsyids = Array.from(selectionSet);
        navigateGraphs(cachedData, selectedForsyids, focus);
    } else {
        fetch('../data/data_dict.json')
            .then(response => response.json())
            .then(data => {
                cachedData = data;
                const selectedForsyids = Array.from(selectionSet);
                navigateGraphs(cachedData, selectedForsyids, focus);
            })
            .catch(error => console.error('Error loading data:', error));
    }
}

// Initialize graph
updateGraph();