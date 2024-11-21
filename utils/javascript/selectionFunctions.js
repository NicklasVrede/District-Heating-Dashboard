import { updateSelectedPlants, updateSelectedMunicipalities } from './eventListeners.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';

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
            const municipalitySource = map.getSource('municipalities');
            if (municipalitySource && municipalitySource._data) {
                municipalitySource._data.features.forEach(feature => {
                    if (feature.properties.lau_1) {
                        selectionSet.add(feature.properties.lau_1);
                    }
                });
            }
            updateSelectedMunicipalities(map);
        } else {
            // Select all plants and areas
            const plantFeatures = map.querySourceFeatures('plants');
            plantFeatures.forEach(feature => {
                selectionSet.add(feature.properties.forsyid);
            });

            const areaFeatures = map.querySourceFeatures('areas');
            areaFeatures.forEach(feature => {
                selectionSet.add(feature.properties.forsyid);
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