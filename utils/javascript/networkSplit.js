import { loadData, clearCache } from './dataManager.js';

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
    
    // Toggle between merged and unmerged data
    if (isNetworkSplitActive) {
        fetch('data/plants.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('plants').setData(data);
            });
        
        fetch('maps/areas.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('areas').setData(data);
            });
    } else {
        fetch('data/plants_merged.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('plants').setData(data);
            });
        
        fetch('maps/areas_merged.geojson')
            .then(response => response.json())
            .then(data => {
                map.getSource('areas').setData(data);
            });
    }

    // Clear and reload the cached data
    clearCache();
    loadData().catch(error => console.error('Error reloading data:', error));
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 