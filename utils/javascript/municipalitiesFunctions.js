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
    map.setLayoutProperty('plants', 'visibility', otherLayersVisibility); // Assuming 'plants' is the ID for the plants layer

    // Clear all selections when toggling municipalities
    
    clearSelection(map); 
    updateSelectedPlantsWindow();
    updateSelectedPlants(map);
    updateSelectedMunicipalities(map);
    

    // Update button style
    button.classList.toggle('municipalities-active', municipalitiesVisible);
}
