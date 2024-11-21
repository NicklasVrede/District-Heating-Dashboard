import { clearSelection } from './selectionFunctions.js'; // Import clearSelection function
import { updateSelectedPlants, updateSelectedMunicipalities } from './eventListeners.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { selectionSet } from '../../main.js';

export let municipalitiesVisible = false; // Track the visibility state

export function toggleMunicipalities(map, button) {
    municipalitiesVisible = !municipalitiesVisible; // Toggle the state
    console.log(`Toggling municipalities visibility: ${municipalitiesVisible}`);
    
    // Show or hide municipalities based on the current state
    const municipalitiesVisibility = municipalitiesVisible ? 'visible' : 'none';
    map.setLayoutProperty('municipalities-fill', 'visibility', municipalitiesVisibility);
    map.setLayoutProperty('municipalities-line', 'visibility', municipalitiesVisibility);

    // Set visibility of other layers (areas and plants) based on municipalities visibility
    const otherLayersVisibility = municipalitiesVisible ? 'none' : 'visible';

    // Set areas visibility
    map.setLayoutProperty('areas', 'visibility', otherLayersVisibility);

    // Set plants visibility
    map.setLayoutProperty('plants', 'visibility', otherLayersVisibility);

    // Explicitly hide price layers
    if (map.getLayer('plants-price')) {
        map.setLayoutProperty('plants-price', 'visibility', 'none');
    }
    if (map.getLayer('municipalities-price')) {
        map.setLayoutProperty('municipalities-price', 'visibility', 'none');
    }

    // Clear all selections when toggling municipalities
    selectionSet.clear();
    updateSelectedPlantsWindow();
    updateSelectedMunicipalities(map);
    updateSelectedPlants(map);

    // Clear the graph
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
        graphContainer.innerHTML = '';
    }

    // Update button style
    button.classList.toggle('municipalities-active', municipalitiesVisible);
}
