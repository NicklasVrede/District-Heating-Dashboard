import { updateSelectedPlants, updateSelectedMunicipalities } from './eventListeners.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { municipalitiesVisible } from './municipalitiesFunctions.js';
import { addInstructions } from './instructions.js';
import { clearGraph } from './clearGraph.js';
import { showToast } from '../../graphs/components/toast.js';
import { getCachedData } from './dataManager.js';

let toastDebounceTimer = null;
let noDataCount = 0;
let newSelectionAttempts = 0;

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
                    modifySelection(map, feature.properties.lau_1, 'add', false);
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
                    modifySelection(map, feature.properties.forsyid, 'add', false);
                }
            });
            updateSelectedPlants(map);
        }

        // Update the selection window and graph
        updateSelectedPlantsWindow();
        updateGraph(selectionSet);
    });
}

export function modifySelection(map, id, action = 'add', updateUI = true) {
    if (!['add', 'remove', 'toggle'].includes(action)) {
        console.warn('Invalid selection action:', action);
        return false;
    }

    // Reset counters at the start of each selection attempt
    newSelectionAttempts = 0;
    noDataCount = 0;

    const isCurrentlySelected = selectionSet.has(id);
    let selectionChanged = false;

    if ((action === 'add' || action === 'toggle') && !isCurrentlySelected) {
        newSelectionAttempts++;
        
        if (municipalitiesVisible) {
            // For municipalities, check data using lau_1
            const municipalityData = getCachedData()?.[id.toString()];
            
            if (municipalityData && (
                Object.values(municipalityData.production || {}).some(year => Object.values(year).some(v => v > 0)) ||
                Object.values(municipalityData.prices || {}).some(year => year.mwh_price > 0)
            )) {
                selectionSet.add(id);
                selectionChanged = true;
            } else {
                noDataCount++;
                clearTimeout(toastDebounceTimer);
                toastDebounceTimer = setTimeout(() => {
                    const validSelections = newSelectionAttempts - noDataCount;
                    if (newSelectionAttempts === 1) {
                        showToast("Municipality could not be selected due to missing data");
                    } else {
                        showToast(`${validSelections} municipalities selected, ${noDataCount} could not be selected due to missing data`);
                    }
                }, 300);
                return false;
            }
        } else {
            // For plants, check data using forsyid (padded with zeros)
            const plantData = getCachedData()?.[id.toString().padStart(8, '0')];
            
            if (plantData && (
                Object.values(plantData.production || {}).some(year => Object.values(year).some(v => v > 0)) ||
                Object.values(plantData.prices || {}).some(year => year.mwh_price > 0)
            )) {
                selectionSet.add(id);
                selectionChanged = true;
            } else {
                noDataCount++;
                clearTimeout(toastDebounceTimer);
                toastDebounceTimer = setTimeout(() => {
                    const validSelections = newSelectionAttempts - noDataCount;
                    if (newSelectionAttempts === 1) {
                        showToast("Plant could not be selected due to missing data");
                    } else {
                        showToast(`${validSelections} plants selected, ${noDataCount} could not be selected due to missing data`);
                    }
                }, 300);
                return false;
            }
        }
    } else if (action === 'remove' && isCurrentlySelected) {
        selectionSet.delete(id);
        selectionChanged = true;
    }

    if (selectionChanged && updateUI) {
        updateSelectedPlants(map);
        updateSelectedMunicipalities(map);
        updateSelectedPlantsWindow();
        selectionSet.size === 0 ? clearGraph() : updateGraph();
    }

    return selectionChanged;
}