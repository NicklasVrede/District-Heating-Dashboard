import { updateSelectedPlants, updateSelectedMunicipalities } from './eventListeners.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { municipalitiesVisible } from './municipalitiesFunctions.js';

export function clearSelection(map) {
    selectionSet.clear();
    updateSelectedPlants(map);
    updateSelectedPlantsWindow();

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
        // Clear existing selection
        selectionSet.clear();

        if (municipalitiesVisible) {
            // Select all municipalities
            const features = map.queryRenderedFeatures({
                layers: ['municipalities-fill']
            });
            
            features.forEach(feature => {
                if (feature.properties.lau_1) {
                    selectionSet.add(feature.properties.lau_1);
                }
            });
            updateSelectedMunicipalities(map);
        } else {
            // Select all plants
            const features = map.queryRenderedFeatures({
                layers: ['plants']
            });
            
            features.forEach(feature => {
                if (feature.properties.forsyid) {
                    selectionSet.add(feature.properties.forsyid);
                }
            });
            updateSelectedPlants(map);
        }

        // Update the selection window and graph
        updateSelectedPlantsWindow();
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
    updateSelectedPlantsWindow();

    if (selectionSet.size === 0) {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.innerHTML = '';
        }
    }
    
    updateGraph();
}

export { toggleSelection };