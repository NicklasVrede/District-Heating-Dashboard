import { loadData, clearCache } from './dataManager.js';
import { MainFuelManager } from './focusLayers/MainFuelManager.js';
import { yearState } from './focusLayers/YearState.js';
import { updateLoadingState, totalLoadingTasks } from './loadingSpinner.js';

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

    // Show the spinner
    updateLoadingState(true, 'Updating network data...');
    
    // Force delay before starting operations
    setTimeout(() => {
        // Create promises for both fetches
        const plantsPromise = fetch(isNetworkSplitActive ? 'data/plants.geojson' : 'data/plants_merged.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('plants').setData(data);
            });
        
        const areasPromise = fetch(isNetworkSplitActive ? 'maps/areas.geojson' : 'maps/areas_merged.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('areas').setData(data);
            });
        
        Promise.all([plantsPromise, areasPromise])
            .then(() => {
                clearCache();
                return loadData();
            })
            .then(() => {
                MainFuelManager.getInstance(map).updateMainFuel(yearState.year);
                updateLoadingState(false);
            })
            .catch(error => {
                console.error('Error updating network split:', error);
                updateLoadingState(false);
            });
    }, 500);
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 