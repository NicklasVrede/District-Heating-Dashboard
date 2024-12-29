import { loadData, clearCache } from './dataManager.js';
import { MainFuelManager } from './focusLayers/MainFuelManager.js';
import { yearState } from './focusLayers/YearState.js';

// Track the active state
let isNetworkSplitActive = false;

export function toggleNetworkSplit(map) {
    // Get the button and overlay
    const button = document.querySelector('.network-split-button');
    const loadingSpinner = document.getElementById('loading-spinner');
    const mapOverlay = document.getElementById('map-overlay');
    
    // Toggle state
    isNetworkSplitActive = !isNetworkSplitActive;
    
    // Update button appearance
    button.classList.toggle('active', isNetworkSplitActive);
    
    // Clear any existing selection
    if (window.clearSelection) {
        window.clearSelection();
    }
    
    // Show loading spinner and overlay with fade effect
    if (loadingSpinner) {
        loadingSpinner.classList.remove('fade-out');
        loadingSpinner.style.display = 'flex';
    }
    if (mapOverlay) {
        mapOverlay.style.display = 'block';
        // Use setTimeout to ensure the display: block has taken effect
        setTimeout(() => {
            mapOverlay.classList.add('active');
        }, 10);
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
            
            clearCache();
            return loadData();
        })
        .then(() => {
            MainFuelManager.getInstance(map).updateMainFuel(yearState.year);
            
            // Hide loading spinner and overlay with fade
            if (loadingSpinner) {
                loadingSpinner.classList.add('fade-out');
            }
            if (mapOverlay) {
                mapOverlay.classList.remove('active');
                mapOverlay.classList.add('fade-out');
                setTimeout(() => {
                    loadingSpinner.style.display = 'none';
                    mapOverlay.style.display = 'none';
                    mapOverlay.classList.remove('fade-out');
                }, 700);
            }
        })
        .catch(error => {
            console.error('Error updating network split:', error);
            // Ensure loading spinner and overlay are hidden on error
            if (loadingSpinner) {
                loadingSpinner.classList.add('fade-out');
            }
            if (mapOverlay) {
                mapOverlay.classList.remove('active');
                mapOverlay.classList.add('fade-out');
                setTimeout(() => {
                    loadingSpinner.style.display = 'none';
                    mapOverlay.style.display = 'none';
                    mapOverlay.classList.remove('fade-out');
                }, 700); // Increased to match the CSS transition
            }
        });
    
    return isNetworkSplitActive;
}

// Export the state for other modules that might need it
export function getNetworkSplitState() {
    return isNetworkSplitActive;
} 