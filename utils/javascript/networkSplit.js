import { loadData, clearCache } from './dataManager.js';
import { MainFuelManager } from './focusLayers/MainFuelManager.js';
import { yearState } from './focusLayers/YearState.js';

// Track the active state
let isNetworkSplitActive = false;

export function toggleNetworkSplit(map) {
    // Get the button
    const button = document.querySelector('.network-split-button');
    
    // Toggle state
    isNetworkSplitActive = !isNetworkSplitActive;
    
    // Update button appearance
    button.classList.toggle('active', isNetworkSplitActive);
    
    // Clear any existing selection
    if (window.clearSelection) {
        window.clearSelection();
    }
    
    // Create promises for both fetches
    const plantsPromise = fetch(isNetworkSplitActive ? 'data/plants.geojson' : 'data/plants_merged.geojson')
        .then(response => response.json());
    
    const areasPromise = fetch(isNetworkSplitActive ? 'maps/areas.geojson' : 'maps/areas_merged.geojson')
        .then(response => response.json());
    
    // Wait for both fetches to complete
    Promise.all([plantsPromise, areasPromise])
        .then(([plantsData, areasData]) => {
            map.getSource('plants').setData(plantsData);
            map.getSource('areas').setData(areasData);
            
            // Clear and reload the cached data before updating main fuel
            clearCache();
            return loadData();
        })
        .then(() => {
            // Update main fuel after data is loaded
            MainFuelManager.getInstance(map).updateMainFuel(yearState.year);
        })
        .catch(error => console.error('Error updating network split:', error));
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 