import { loadData, clearCache } from './dataManager.js';
import { MainFuelManager } from './focusLayers/MainFuelManager.js';
import { yearState } from './focusLayers/YearState.js';
import { updateLoadingState } from './loadingSpinner.js';

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
    
    // Show loading spinner
    updateLoadingState(true, 'Loading network data...');
    
    // Create promises for both fetches
    const plantsPromise = fetch(isNetworkSplitActive ? 'data/plants.geojson' : 'data/plants_merged.geojson')
        .then(response => response.json())
        .then(data => {
            updateLoadingState(true, 'Updating plant data...');
            map.getSource('plants').setData(data);
        });
    
    const areasPromise = fetch(isNetworkSplitActive ? 'maps/areas.geojson' : 'maps/areas_merged.geojson')
        .then(response => response.json())
        .then(data => {
            updateLoadingState(true, 'Updating area data...');
            map.getSource('areas').setData(data);
        });
    
    // Wait for both fetches to complete
    Promise.all([plantsPromise, areasPromise])
        .then(() => {
            updateLoadingState(true, 'Refreshing data cache...');
            clearCache();
            return loadData();
        })
        .then(() => {
            updateLoadingState(true, 'Updating fuel display...');
            MainFuelManager.getInstance(map).updateMainFuel(yearState.year);
            
            // Hide loading spinner
            for (let i = 0; i < 5; i++) {  // Match the number of updateLoadingState calls
                updateLoadingState(false);
            }
        })
        .catch(error => {
            console.error('Error updating network split:', error);
            // Ensure loading spinner is hidden on error
            for (let i = 0; i < 5; i++) {
                updateLoadingState(false);
            }
        });
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 