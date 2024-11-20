// Import styles
import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';
import { setMapInstance } from './utils/javascript/mapInstance.js';

// Import utility functions
import { loadPlants, loadAreas, loadGasAreas, loadMunicipalities } from './utils/javascript/loadData.js';
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

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg';

// Export selection set
export const selectionSet = new Set();

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [10.0, 56.0],
    zoom: 6.5
});

// Initialize FocusManager
const focusManager = new FocusManager(map);

// Function to handle focus changes
function changeFocus(value) {
    const measureContainer = document.getElementById('measure-container');
    
    if (!measureContainer) {
        console.warn('Measure container not found');
        return;
    }

    // Update the global focus state
    focusState.focus = value;

    // First, hide measure container by default
    measureContainer.classList.remove('visible');
    measureContainer.classList.add('hidden');

    // If no focus or none selected, just apply the focus change
    if (!value || value === 'none') {
        focusManager.changeFocus(value);
        return;
    }

    // Show/hide containers based on focus
    if (value === 'production') {
        measureContainer.classList.remove('hidden');
        measureContainer.classList.add('visible');
    }

    // Apply the focus change and update graphs
    focusManager.changeFocus(value);
    updateGraph();
}

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
    // Load your data after map is ready
    loadPlants(map);
    loadAreas(map);
    loadGasAreas(map);
    loadMunicipalities(map);
    initializeLasso(map);
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
