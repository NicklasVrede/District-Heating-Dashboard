// Import styles
import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';

// Import utility functions
import { loadPlants, loadAreas, loadGasAreas } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';
import { updateSelectedPlants } from './utils/javascript/eventListeners.js';
import { clearSelection, selectAll } from './utils/javascript/selectionFunctions.js';
import { toggleGasAreas } from './utils/javascript/toggleGasAreas.js';
import { initDivider } from './utils/javascript/divider.js';


// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg';

// Export map instance and selection set
export const selectionSet = new Set();
export const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [10.0, 56.0],
    zoom: 6.5
});

// Configure map settings
map.scrollZoom.enable();
map.scrollZoom.setWheelZoomRate(1);

// Initialize map data on load
map.on('load', () => {
    loadPlants(map);
    loadAreas(map);
    loadGasAreas(map);
});

// Expose functions to global scope
window.searchAddress = searchAddress;
window.toggleGasAreas = () => toggleGasAreas(map);
window.clearSelection = () => clearSelection(map);
window.selectAll = () => selectAll(map);

// After your map is initialized
initDivider(map);  // Pass the map object here