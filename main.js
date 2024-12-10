// Import styles
import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';
import { setMapInstance } from './utils/javascript/mapInstance.js';

// Import utility functions
import { loadPlants, loadAreas, loadGasAreas, loadMunicipalities, loadMunicipalityCentroids } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';
import { updateSelectedPlants } from './utils/javascript/eventListeners.js';
import { clearSelection, selectAll } from './utils/javascript/selectionFunctions.js';
import { toggleGasAreas } from './utils/javascript/toggleGasAreas.js';
import { initDivider } from './utils/javascript/divider.js';
import { FocusManager } from './utils/javascript/focusLayers/FocusManager.js';
import { updateGraph } from './graphs/graphManager.js';
import { focusState } from './utils/javascript/focusLayers/FocusState.js';
import { initializeLasso, toggleLassoSelect } from './utils/javascript/lassoSelect.js';
import { toggleMunicipalities } from './utils/javascript/municipalitiesFunctions.js';
import { initMapFocusDropdown, changeFocus } from './utils/javascript/mapFocusDropdown.js';
import { allPlantIds, allMunicipalityIds, initializeIdSets } from './utils/javascript/idSets.js';

// Import the addInstructions function
import { addInstructions } from './utils/javascript/instructions.js';

// Export the sets so they're available to other modules that import from main.js
export { allPlantIds, allMunicipalityIds };

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg';

// Export selection set
export const selectionSet = new Set();

// Add this near the top of the file after imports
let loadingCounter = 0;
const totalLoadingTasks = 5; // Number of loading tasks (plants, areas, gas areas, municipalities, centroids)

function updateLoadingState(increment = true) {
    if (increment) {
        loadingCounter++;
    } else {
        loadingCounter--;
    }
    
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        if (loadingCounter > 0) {
            loadingSpinner.style.display = 'flex';
        } else {
            loadingSpinner.style.display = 'none';
        }
    }
}

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [10.0, 56.0],
    zoom: 6.5
});

// Initialize FocusManager
const focusManager = new FocusManager(map);


// Expose functions to global scope
window.searchAddress = searchAddress;
window.toggleGasAreas = () => toggleGasAreas(map);
window.clearSelection = () => clearSelection(map);
window.selectAll = () => selectAll(map);
window.changeFocus = changeFocus;

// Add minimum display duration (in milliseconds)
const MIN_LOADING_TIME = 2000; // 2 seconds
let loadStartTime;

// Wait for map to load before making it globally available
map.on('load', () => {
    window.map = map;
    setMapInstance(map);
    
    // Show loading spinner and record start time
    loadStartTime = Date.now();
    updateLoadingState();
    
    Promise.all([
        loadPlants(map),
        loadAreas(map),
        loadGasAreas(map),
        loadMunicipalities(map),
        loadMunicipalityCentroids(map)
    ]).then(() => {
        // Calculate remaining time to meet minimum display duration
        const elapsedTime = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        // Use setTimeout to ensure minimum display time
        setTimeout(() => {
            updateLoadingState(false);
            initializeLasso(map);
            initMapFocusDropdown(focusManager);
            addInstructions();
        }, remainingTime);
    }).catch(error => {
        console.error('Error loading map data:', error);
        updateLoadingState(false);
    });
});

// Configure map settings
map.scrollZoom.enable();
map.scrollZoom.setWheelZoomRate(1);

// After your map is initialized
initDivider(map);

// After your map initialization
fetch('./data/data_dict.json')
    .then(response => response.json())
    .then(data => {
        window.dataDict = data;
        initializeIdSets(); // initialise plant and municipality id sets
    })
    .catch(error => console.error('Error loading data dictionary:', error));

// Update the resetCamera function
function resetCamera() {
    map.flyTo({
        center: [10.0, 56.0],
        zoom: 6.5,
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
