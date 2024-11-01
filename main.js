import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';
import { loadPlants, loadAreas } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg'; // Replace with your Mapbox access token

// Initialize the map and set its view to a specific location and zoom level
export const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [10.0, 56.0], // starting position [lng, lat] (centered on Denmark)
    zoom: 6.5 // starting zoom
});


// Enable scroll zoom
map.scrollZoom.enable();

// Set zoom around the mouse location
map.scrollZoom.setWheelZoomRate(1); // Adjust the zoom rate if needed

// Load the plants and areas after the map has loaded
map.on('load', () => {
    loadPlants(map);
    loadAreas(map);
    
});

// Expose the searchAddress function to the global scope
window.searchAddress = searchAddress;