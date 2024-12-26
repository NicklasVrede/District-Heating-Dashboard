import { focusState } from './focusLayers/FocusState.js';
import { selectionSet } from '../../main.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { updateSelectedMunicipalities, updateSelectedPlants } from './eventListeners.js';
import { changeFocus } from './mapFocusDropdown.js';
import { clearGraph } from './clearGraph.js';

export let municipalitiesVisible = false;

export function toggleMunicipalities(map, button) {
    municipalitiesVisible = !municipalitiesVisible;
    
    // Store current focus before toggling
    const currentFocus = focusState.focus;
    
    // First, remove the current focus layers
    if (currentFocus !== 'none') {
        map.setLayoutProperty('plants-production', 'visibility', 'none');
        map.setLayoutProperty('municipalities-production', 'visibility', 'none');
        map.setLayoutProperty('plants-price', 'visibility', 'none');
        map.setLayoutProperty('municipalities-price', 'visibility', 'none');
    }
    
    // Show or hide municipalities based on the current state
    const municipalitiesVisibility = municipalitiesVisible ? 'visible' : 'none';
    map.setLayoutProperty('municipalities-fill', 'visibility', municipalitiesVisibility);
    map.setLayoutProperty('municipalities-line', 'visibility', municipalitiesVisibility);

    // Set visibility of other layers (areas and plants) based on municipalities visibility
    const otherLayersVisibility = municipalitiesVisible ? 'none' : 'visible';
    map.setLayoutProperty('areas', 'visibility', otherLayersVisibility);
    map.setLayoutProperty('plants', 'visibility', otherLayersVisibility);
    map.setLayoutProperty('areas-border', 'visibility', otherLayersVisibility);

    // Toggle network split button visibility
    const networkSplitButton = document.querySelector('.network-split-button');
    if (networkSplitButton) {
        networkSplitButton.style.display = municipalitiesVisible ? 'none' : 'flex';
    }

    // Clear selections and graph
    selectionSet.clear();
    updateSelectedPlantsWindow();
    updateSelectedMunicipalities(map);
    updateSelectedPlants(map);

    clearGraph();

    // Update button style
    button.classList.toggle('municipalities-active', municipalitiesVisible);

    // Reapply the current focus if it's not 'none'
    if (currentFocus && currentFocus !== 'none') {
        // Small delay to ensure layer switches are complete
        setTimeout(() => {
            changeFocus(currentFocus);
        }, 50);
    }
}
