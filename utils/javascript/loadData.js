import { plantStyles } from '../../styles/plantStyles.js';
import { areaStyles } from '../../styles/areaStyles.js';
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

            // Add event listeners for areas
            addAreaEventListeners(map);
        })
        .catch(error => {
            console.error('Error fetching area data:', error);
        });
}