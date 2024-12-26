// Import styles
import { setMapInstance } from './utils/javascript/mapInstance.js';

// Import utility functions
import { loadPlants, loadAreas, loadGasAreas, loadMunicipalities, loadMunicipalityCentroids } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';
import { clearSelection, selectAll } from './utils/javascript/selectionFunctions.js';
import { toggleGasAreas } from './utils/javascript/toggleGasAreas.js';
import { initDivider } from './utils/javascript/divider.js';
import { FocusManager } from './utils/javascript/focusLayers/FocusManager.js';
import { initializeLasso, toggleLassoSelect } from './utils/javascript/lassoSelect.js';
import { toggleMunicipalities } from './utils/javascript/municipalitiesFunctions.js';
import { initMapFocusDropdown, changeFocus } from './utils/javascript/mapFocusDropdown.js';
import { allPlantIds, allMunicipalityIds, initializeIdSets } from './utils/javascript/idSets.js';

// Import the addInstructions function
import { addInstructions } from './utils/javascript/instructions.js';

// Import the loadData function
import { loadData } from './utils/javascript/dataManager.js';

// Import the toggleNetworkSplit function
import { toggleNetworkSplit } from './utils/javascript/networkSplit.js';

// Export the sets so they're available to other modules that import from main.js
export { allPlantIds, allMunicipalityIds };

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg';

// Export selection set
export const selectionSet = new Set();

// Initialize loading spinner after disclaimer check
let loadingCounter = 0;
const totalLoadingTasks = 5;
const loadingSpinner = document.getElementById('loading-spinner');

function updateLoadingState(increment = true) {
    if (increment) {
        loadingCounter++;
    } else {
        loadingCounter--;
    }
    
    if (loadingSpinner) {
        if (loadingCounter > 0) {
            loadingSpinner.classList.remove('fade-out');
            loadingSpinner.style.display = 'flex';
        } else {
            loadingSpinner.classList.add('fade-out');
            setTimeout(() => {
                loadingSpinner.style.display = 'none';
            }, 500);
        }
    }
}

// Show loading spinner immediately
updateLoadingState();

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [11, 56.0],
    zoom: 6
});

// Initialize FocusManager
const focusManager = new FocusManager(map);


// Expose functions to global scope
window.searchAddress = searchAddress;
window.toggleGasAreas = () => toggleGasAreas(map);
window.clearSelection = () => clearSelection(map);
window.selectAll = () => selectAll(map);
window.changeFocus = changeFocus;


// Wait for map to load before making it globally available
map.on('load', () => {
    window.map = map;
    setMapInstance(map);
    
    Promise.all([
        loadPlants(map),
        loadAreas(map),
        loadGasAreas(map),
        loadMunicipalities(map),
        loadMunicipalityCentroids(map)
    ]).then(() => {
        map.once('idle', () => {
            // Hide loading spinner
            for (let i = 0; i < totalLoadingTasks; i++) {
                updateLoadingState(false);
            }
            
            // Initialize features
            initializeLasso(map);
            initMapFocusDropdown(focusManager);
            addInstructions();
            
            // Show controls by adding loaded class
            document.querySelector('.map-controls').classList.add('loaded');
            
            // Toggle municipalities on by default
            //toggleMunicipalities(map, document.querySelector('[onclick="toggleMunicipalities(this)"]'));
        });
    }).catch(error => {
        console.error('Error loading map data:', error);
        // Ensure loading spinner is hidden on error
        for (let i = 0; i < totalLoadingTasks; i++) {
            updateLoadingState(false);
        }
    });
});

// Configure map settings
map.scrollZoom.enable();
map.scrollZoom.setWheelZoomRate(1);

// After your map is initialized
initDivider(map);

// Replace the fetch call with:
loadData()
    .then(() => {
        initializeIdSets(); // initialize plant and municipality id sets
    })
    .catch(error => console.error('Error loading data dictionary:', error));

// Update the resetCamera function
function resetCamera() {
    map.flyTo({
        center: [11, 56.0],
        zoom: 6,
        pitch: 0,
        bearing: 0,
        essential: true
    });
}

// Add to your window exports
window.resetCamera = resetCamera;
window.toggleLassoSelect = toggleLassoSelect;

// Expose the toggleMunicipalities function to the global scope
window.toggleMunicipalities = (button) => toggleMunicipalities(map, button);

// Show disclaimer when page loads
document.addEventListener('DOMContentLoaded', () => {
    const disclaimerShown = localStorage.getItem('disclaimerShown');
    if (!disclaimerShown) {
        showDisclaimer();
    }
});

function showDisclaimer() {
    const modal = document.getElementById('disclaimer-modal');
    modal.style.display = 'block';
}

window.closeDisclaimer = function() {
    const modal = document.getElementById('disclaimer-modal');
    modal.style.display = 'none';
    localStorage.setItem('disclaimerShown', 'true');
};

// Update or add to your window exports
window.toggleNetworkSplit = () => toggleNetworkSplit(map);
