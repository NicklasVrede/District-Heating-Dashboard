import { plantStyles } from '../../styles/plantStyles.js';
import { areaStyles, gasAreaStyles } from '../../styles/areaStyles.js'; // Import gas area styles
import { addPlantEventListeners, addAreaEventListeners } from './eventListeners.js';


export function loadPlants(map) {
    fetch('data/plants.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            console.log('Plant data:', geojson); // Debugging: Log the plant data

            // Add the GeoJSON source to the map
            map.addSource('plants', {
                type: 'geojson',
                data: geojson
            });

            // Add a layer to visualize the plants with custom styles
            map.addLayer(plantStyles);

            // Add a layer for highlighted plants
            map.addLayer({
                id: 'highlighted-plant',
                type: 'circle',
                source: 'plants',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#B42222',
                    'circle-stroke-width': 0,
                    'circle-stroke-color': '#FF0000',
                    'circle-blur': 0,
                    'circle-opacity': 1
                },
                filter: ['==', ['get', 'forsyid'], '']
            });

            // Add a layer for selected plants with a different style
            map.addLayer({
                id: 'selected-plants',
                type: 'circle',
                source: 'plants',
                paint: {
                    'circle-radius': 8, // Larger radius for selected plants
                    'circle-color': '#FF0000', // Red color for selected plants
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#000000' // Black border for selected plants
                },
                filter: ['in', 'forsyid', ''] // Initial filter to include no plants
            });

            // Add event listeners for plants
            addPlantEventListeners(map);
        })
        .catch(error => {
            console.error('Error fetching plant data:', error);
        });
}

export function loadAreas(map) {
    fetch('maps/areas.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            console.log('Area data:', geojson); // Debugging: Log the area data

            // Add the GeoJSON source to the map
            map.addSource('areas', {
                type: 'geojson',
                data: geojson
            });

            // Add a layer to visualize the areas with custom styles
            map.addLayer(areaStyles.fill);

            // Add a border to the areas with custom styles
            map.addLayer(areaStyles.line);

            // Add a layer for selected areas with a different style
            map.addLayer({
                id: 'selected-areas',
                type: 'fill',
                source: 'areas',
                paint: {
                    'fill-color': '#FF0000', // Red color for selected areas
                    'fill-opacity': 0.5
                },
                filter: ['in', 'forsyid', ''] // Initial filter to include no areas
            });

            // Add event listeners for areas
            addAreaEventListeners(map);
        })
        .catch(error => {
            console.error('Error fetching area data:', error);
        });
}

export function loadGasAreas(map) {
    fetch('maps/gas_areas.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            console.log('Gas area data:', geojson); // Debugging: Log the gas area data

            // Add the GeoJSON source to the map
            map.addSource('gas-areas', {
                type: 'geojson',
                data: geojson
            });

            // hidden by default
            map.addLayer({
                ...gasAreaStyles.fill,
                layout: {
                    'visibility': 'none' // Hide the fill layer by default
                }
            });

            // Add a border to the gas areas with custom styles, hidden by default
            map.addLayer({
                ...gasAreaStyles.line,
                layout: {
                    'visibility': 'none' // Hide the line layer by default
                }
            });
        })
        .catch(error => {
            console.error('Error fetching gas area data:', error);
        });
}