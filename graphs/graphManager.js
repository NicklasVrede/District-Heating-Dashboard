import { createSinglePlantGraph } from './components/singlePlant.js';
import { createOrUpdatePlotlyGraph } from './components/multiPlant.js';
import { createTwoPlantComparison } from './components/twoPlantComparison.js';
import { selectionSet } from '../main.js';
import { loadData, getCachedData } from '../utils/javascript/dataManager.js';
import { focusState } from '../utils/javascript/focusLayers/FocusState.js';
import { createOverviewPlants } from './components/overviewPlants.js';

let currentCleanup = null;

// Function to determine which graph to display
function navigateGraphs(data, selectedForsyids) {
    // Use focus from focusState
    const focus = focusState.focus;

    // Clean up previous visualization if exists
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    const graphContainer = document.getElementById('graph-container');
    
    // Clear and return if there are no selections
    if (!selectedForsyids || selectedForsyids.length === 0) {
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

    // Try to create overview display for large selections
    if (selectedForsyids.length > 10 && createOverviewPlants(data, selectedForsyids)) {
        return;
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
            currentCleanup = createOrUpdatePlotlyGraph(data, selectedForsyids, focus);
            break;
    }
}

// Function to update the graph   //Apply default!
export async function updateGraph() {
    try {
        const data = await loadData();
        const selectedForsyids = Array.from(selectionSet);
        navigateGraphs(data, selectedForsyids);
    } catch (error) {
        console.error('Error updating graph:', error);
        const graphContainer = document.getElementById('graph-container');
        graphContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
}

// Initialize graph
updateGraph();