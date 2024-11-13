import { updateSelectedPlants } from './eventListeners.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';

export function clearSelection(map) {
    selectionSet.clear();
    updateSelectedPlants(map);
    updateSelectedPlantsWindow(selectionSet);

    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
        graphContainer.innerHTML = '';
    }

    setTimeout(() => {
        updateGraph(selectionSet);
    }, 100);
}

export function selectAll(map) {
    map.fitBounds([
        [7.5, 54.5],
        [13.0, 57.75]
    ], {
        padding: 20
    });

    map.once('moveend', () => {
        const plantFeatures = map.querySourceFeatures('plants');
        plantFeatures.forEach(feature => {
            selectionSet.add(feature.properties.forsyid);
        });

        const areaFeatures = map.querySourceFeatures('areas');
        areaFeatures.forEach(feature => {
            selectionSet.add(feature.properties.forsyid);
        });

        updateSelectedPlants(map);
        updateGraph(selectionSet);  
    });
}

function toggleSelection(map, forsyid, isCtrlPressed) {
    if (isCtrlPressed) {
        if (selectionSet.has(forsyid)) {
            selectionSet.delete(forsyid);
        }
    } else {
        if (!selectionSet.has(forsyid)) {
            selectionSet.add(forsyid);
        }
    }
    updateSelectedPlants(map);
    updateSelectedPlantsWindow(selectionSet);

    if (selectionSet.size === 0) {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.innerHTML = '';
        }
    }
    
    updateGraph();
}

export { toggleSelection };