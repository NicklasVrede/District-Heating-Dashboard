// Import styles
import { areaStyles } from './styles/areaStyles.js';
import { plantStyles } from './styles/plantStyles.js';
import { setMapInstance } from './utils/javascript/mapInstance.js';

// Import utility functions
import { loadPlants, loadAreas, loadGasAreas } from './utils/javascript/loadData.js';
import { searchAddress } from './utils/javascript/addressLookup.js';
import { updateSelectedPlants } from './utils/javascript/eventListeners.js';
import { clearSelection, selectAll } from './utils/javascript/selectionFunctions.js';
import { toggleGasAreas } from './utils/javascript/toggleGasAreas.js';
import { initDivider } from './utils/javascript/divider.js';
import { FocusManager } from './utils/javascript/focusLayers/FocusManager.js';
import { updateGraph } from './graphs/graphManager.js';

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
    const yearSliderContainer = document.getElementById('year-slider-container');
    const yearSlider = document.getElementById('year-slider');
    const yearLabel = document.getElementById('year-label');
    
    // Show/hide measure selector based on focus
    if (value === 'production') {
        measureContainer.classList.remove('hidden');
        measureContainer.classList.add('visible');
        // Set production years range and default value
        yearSlider.min = "2021";
        yearSlider.max = "2023";
        yearSlider.value = "2023"; // Set default value for production
        yearLabel.textContent = "2023"; // Update the label
    } else if (value === 'price') {
        measureContainer.classList.remove('visible');
        measureContainer.classList.add('hidden');
        // Set price years range and default value
        yearSlider.min = "2019";
        yearSlider.max = "2024";
        yearSlider.value = "2024"; // Set default value for price
        yearLabel.textContent = "2024"; // Update the label
    } else {
        measureContainer.classList.remove('visible');
        measureContainer.classList.add('hidden');
        yearSliderContainer.classList.remove('visible');
        yearSliderContainer.classList.add('hidden');
    }

    // Show year slider for both price and production focus
    if (value === 'price' || value === 'production') {
        yearSliderContainer.classList.remove('hidden');
        yearSliderContainer.classList.add('visible');
    }

    // Apply the focus change
    focusManager.changeFocus(value);
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
});

// Configure map settings
map.scrollZoom.enable();
map.scrollZoom.setWheelZoomRate(1);

// After your map is initialized
initDivider(map);

// After your map initialization
fetch('data/data_dict.json')
    .then(response => response.json())
    .then(data => {
        window.dataDict = data;
    })
    .catch(error => console.error('Error loading data dictionary:', error));

// Add event listener for year slider
document.getElementById('year-slider').addEventListener('input', function(e) {
    document.getElementById('year-label').textContent = e.target.value;
});