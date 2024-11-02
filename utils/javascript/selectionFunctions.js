import { updateSelectedPlants } from './eventListeners.js';
import { selectionSet } from '../../main.js'; // Adjust the path as needed

// Define the clearSelection function
export function clearSelection(map) {
    // Clear the selection
    selectionSet.clear();
    console.log('Cleared selection');
    updateSelectedPlants(map);
}

// Define the selectAll function
export function selectAll(map) {
    // Fit the map to the bounds of Denmark
    map.fitBounds([
        [7.5, 54.5],
        [13.0, 57.75]
    ], {
        padding: 20
    });

    // Wait for the zoom to finish
    map.once('moveend', () => {
        // Select all plants
        const plantFeatures = map.querySourceFeatures('plants');
        plantFeatures.forEach(feature => {
            selectionSet.add(feature.properties.forsyid);
        });

        // Select all areas
        const areaFeatures = map.querySourceFeatures('areas');
        areaFeatures.forEach(feature => {
            selectionSet.add(feature.properties.forsyid);
        });

        console.log('Selected all features');
        updateSelectedPlants(map);
    });
}