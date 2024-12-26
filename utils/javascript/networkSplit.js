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
        console.log('Network split mode activated');
        // Load unmerged data
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
        console.log('Network split mode deactivated');
        // Load merged data
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
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 