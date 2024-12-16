import { createSinglePlantGraph } from './components/singlePlant.js';
import { createOrUpdatePlotlyGraph } from './components/multiPlant.js';
import { createTwoPlantComparison } from './components/twoPlantComparison.js';
import { selectionSet } from '../main.js';
import { loadData, getCachedData } from '../utils/javascript/dataManager.js';
import { focusState } from '../utils/javascript/focusLayers/FocusState.js';
import { createOverviewPlants } from './components/overviewPlants.js';
import { clearGraph } from '../utils/javascript/clearGraph.js';

let currentCleanup = null;

// Function to determine which graph to display
function navigateGraphs(data, selectedForsyids) {
    const focus = focusState.focus;

    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    if (!selectedForsyids || selectedForsyids.length === 0) {
        clearGraph();
        return;
    }

    if (selectedForsyids.length > 1) {
        const existingFactsDiv = document.getElementById('plant-facts');
        if (existingFactsDiv) {
            existingFactsDiv.remove();
        }
    }

    if (selectedForsyids.length > 10 && createOverviewPlants(data, selectedForsyids)) {
        return;
    }

    switch (selectedForsyids.length) {
        case 1:
            createSinglePlantGraph(data, selectedForsyids[0], focus);
            break;
        case 2:
            currentCleanup = createTwoPlantComparison(data, selectedForsyids);
            break;
        default:
            if (focus === 'default') {
                createOrUpdatePlotlyGraph(data, selectedForsyids, 'default');
            } else {
                currentCleanup = createOrUpdatePlotlyGraph(data, selectedForsyids, focus);
            }
            break;
    }
}

// Function to update the graph
export async function updateGraph() {
    try {
        const data = await loadData();
        const selectedForsyids = Array.from(selectionSet);
        navigateGraphs(data, selectedForsyids);
    } catch (error) {
        const graphContainer = document.getElementById('graph-container');
        graphContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
}

// Initialize graph
updateGraph();