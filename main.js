import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';
import { loadPlants, loadAreas, loadGasAreas } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';
import { updateSelectedPlants } from './utils/javascript/eventListeners.js';
import { clearSelection, selectAll } from './utils/javascript/selectionFunctions.js';
import { toggleGasAreas } from './utils/javascript/toggleGasAreas.js';


// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg'; 

// Initialize the map
export const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [10.0, 56.0], // starting position [lng, lat] (centered on Denmark)
    zoom: 6.5 // starting zoom
});

// Enable scroll zoom
map.scrollZoom.enable();

// Set zoom around the mouse location
map.scrollZoom.setWheelZoomRate(1);

// Load the plants and areas
map.on('load', () => {
    loadPlants(map);
    loadAreas(map);
    loadGasAreas(map);
});


// Expose the searchAddress function to the global scope
window.searchAddress = searchAddress;

// Expose the toggleGasAreas function to the global scope
window.toggleGasAreas = () => toggleGasAreas(map);

// Initialise the selection set
export const selectionSet = new Set();

// Expose the clearSelection function to the global scope
window.clearSelection = () => clearSelection(map);

// Expose the selectAll function to the global scope
window.selectAll = () => selectAll(map);


