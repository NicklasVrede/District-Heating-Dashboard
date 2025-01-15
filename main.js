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

// Import the MainFuelManager
import { MainFuelManager } from './utils/javascript/focusLayers/MainFuelManager.js';

// Import the year state and initialize year state function
import { yearState, initializeYearState } from './utils/javascript/focusLayers/YearState.js';
import { updateGraph } from './graphs/graphManager.js';

// Import the loading spinner module
import { updateLoadingState, totalLoadingTasks } from './utils/javascript/loadingSpinner.js';

// Initialize year state with the update graph function
initializeYearState(updateGraph);

// Export the sets so they're available to other modules that import from main.js
export { allPlantIds, allMunicipalityIds };

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg';

// Export selection set
export const selectionSet = new Set();

// Initialize loading spinner after disclaimer check
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
    
    // First load the data dictionary
    loadData()
        .then(() => {
            initializeIdSets();
            updateLoadingState(true, 'Loading plants...');
            return Promise.all([
                loadPlants(map),
                loadAreas(map),
                loadGasAreas(map),
                loadMunicipalities(map),
                loadMunicipalityCentroids(map)
            ]);
        })
        .then(() => {
            updateLoadingState(true, 'Initializing map sources...');
            // Wait for map idle and ensure all sources are loaded
            return new Promise(resolve => {
                const checkSources = () => {
                    const requiredSources = ['plants', 'areas', 'gas-areas', 'municipalities', 'municipality-centroids'];
                    const allSourcesLoaded = requiredSources.every(source => map.getSource(source));
                    
                    if (allSourcesLoaded) {
                        resolve();
                    } else {
                        map.once('sourcedata', checkSources);
                    }
                };
                
                checkSources();
            });
        })
        .then(() => {
            updateLoadingState(true, 'Setting up fuel manager...');
            return MainFuelManager.getInstance(map).initialize();
        })
        .then(() => {
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
        })
        .catch(error => {
            console.error('Error loading map data:', error);
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
