import { updateSelectedPlants, updateSelectedMunicipalities } from './eventListeners.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { municipalitiesVisible } from './municipalitiesFunctions.js';
import { addInstructions } from './instructions.js';
import { clearGraph } from './clearGraph.js';
import { showToast } from '../../graphs/components/toast.js';
import { getCachedData } from './dataManager.js';

export function clearSelection(map) {
    selectionSet.clear();
    updateSelectedPlants(map);
    updateSelectedPlantsWindow();

    clearGraph();

    setTimeout(() => {
        updateGraph(selectionSet);
    }, 100);
}

export function selectAll(map) {
    map.fitBounds([
        [7.0, 54.0],
        [17.0, 58.0]
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

export function modifySelection(map, forsyid, action = 'add') {
    console.log('Attempting to select forsyid:', forsyid);
    
    if (!['add', 'remove', 'toggle'].includes(action)) {
        console.warn('Invalid selection action:', action);
        return;
    }

    const isCurrentlySelected = selectionSet.has(forsyid);
    console.log('Currently selected?', isCurrentlySelected);
    let selectionChanged = false;

    if ((action === 'add' || action === 'toggle') && !isCurrentlySelected) {
        const plantData = getCachedData()?.[forsyid.toString().padStart(8, '0')];
        console.log('Plant data:', plantData);
        
        // Skip data validation for municipalities
        if (municipalitiesVisible || (plantData && (
            Object.values(plantData.production || {}).some(year => Object.values(year).some(v => v > 0)) ||
            Object.values(plantData.prices || {}).some(year => year.mwh_price > 0)
        ))) {
            selectionSet.add(forsyid);
            selectionChanged = true;
        } else {
            showToast("No production or price data available");
        }
    } else if (action === 'remove' && isCurrentlySelected) {
        selectionSet.delete(forsyid);
        selectionChanged = true;
    }

    if (selectionChanged) {
        updateSelectedPlants(map);
        updateSelectedMunicipalities(map);
        updateSelectedPlantsWindow();
        selectionSet.size === 0 ? clearGraph() : updateGraph();
    }
}