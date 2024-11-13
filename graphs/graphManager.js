import { createSinglePlantGraph } from './components/singlePlant.js';
import { createOrUpdatePlotlyGraph } from './components/multiPlant.js';
import { createTwoPlantComparison } from './components/twoPlantComparison.js';
import { selectionSet } from '../main.js';
import { loadData, getCachedData } from '../utils/javascript/dataManager.js';

let currentCleanup = null;

// Function to determine which graph to display
function navigateGraphs(data, selectedForsyids, focus) {
    // Clean up previous visualization if exists
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    const graphContainer = document.getElementById('graph-container');
    
    if (!selectedForsyids || selectedForsyids.length === 0) {
        console.error('No forsyid selected');
        graphContainer.innerHTML = '';
        return;
    }

    // Clean up plant facts for multiple plants
    if (selectedForsyids.length > 1) {
        const existingFactsDiv = document.getElementById('plant-facts');
        if (existingFactsDiv) {
            existingFactsDiv.remove();
        }
    }

    // Route to appropriate visualization based on selection count
    switch (selectedForsyids.length) {
        case 1:
            createSinglePlantGraph(data, selectedForsyids[0], focus);
            break;
        case 2:
            currentCleanup = createTwoPlantComparison(data, selectedForsyids);
            break;
        default:
            createOrUpdatePlotlyGraph(data, selectedForsyids);
            break;
    }
}

// Function to update the graph
export async function updateGraph(focus = 'production') {
    try {
        const data = await loadData();
        const selectedForsyids = Array.from(selectionSet);
        navigateGraphs(data, selectedForsyids, focus);
    } catch (error) {
        console.error('Error updating graph:', error);
        const graphContainer = document.getElementById('graph-container');
        graphContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
}

// Initialize graph
updateGraph();