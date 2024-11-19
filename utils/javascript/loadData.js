import { plantStyles } from '../../styles/plantStyles.js';
import { areaStyles, gasAreaStyles } from '../../styles/areaStyles.js'; // Import gas area styles
import { addPlantEventListeners, addAreaEventListeners } from './eventListeners.js';
import { highlightStyles } from '../../styles/highlightStyles.js';
import { graphConfig } from '../../graphs/config/graphConfig.js';


export function loadPlants(map) {
    fetch('data/plants.geojson')
        .then(response => response.json())
        .then(geojson => {
            // Add the GeoJSON source to the map
            map.addSource('plants', {
                type: 'geojson',
                data: geojson
            });

            // Add base plant layer
            map.addLayer(plantStyles);

            // Add price visualization layer (hidden by default)
            map.addLayer({
                id: 'plants-price',
                type: 'circle',
                source: 'plants',
                layout: {
                    'visibility': 'none'
                },
                // filter on defined prices
                filter: ['!=', ['get', 'current_price'], null],
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'current_price'],
                        0, 8,     // min size
                        1500, 25  // max size for highest prices
                    ],
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'current_price'],
                        0, '#00ff00',      // green for low prices
                        750, '#ffff00',    // yellow for medium prices
                        1500, '#ff0000'    // red for high prices
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#000000'
                }
            });

            // Add production visualization layer (hidden by default)
            map.addLayer({
                id: 'plants-production',
                type: 'circle',
                source: 'plants',
                layout: {
                    'visibility': 'none'
                },
                filter: [
                    'all',
                    ['!=', ['get', 'main_fuel'], 'unknown'],
                ],
                paint: {
                    'circle-color': '#888888',  // Default color, will be updated by ProductionFocus
                    'circle-radius': 5,         // Default size, will be updated by ProductionFocus
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'white',
                    'circle-opacity': 0.8
                }
            });

            // Add a layer for highlighted plants
            map.addLayer({
                id: 'highlighted-plant',
                type: 'circle',
                source: 'plants',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#B42222',
                    'circle-stroke-width': highlightStyles.plantStrokeWidth,
                    'circle-stroke-color': highlightStyles.plantStrokeColor,
                    'circle-blur': highlightStyles.plantBlur,
                    'circle-opacity': highlightStyles.plantOpacity
                },
                filter: ['==', ['get', 'forsyid'], '']
            });

            // Update selected plants layer with just a red border
            map.addLayer({
                id: 'selected-plants',
                type: 'circle',
                source: 'plants',
                paint: {
                    'circle-radius': highlightStyles.selectedPlant.radius,
                    'circle-color': highlightStyles.selectedPlant.color,
                    'circle-stroke-width': highlightStyles.selectedPlant.strokeWidth,
                    'circle-stroke-color': highlightStyles.selectedPlant.strokeColor,
                    'circle-stroke-opacity': highlightStyles.selectedPlant.strokeOpacity
                },
                filter: ['in', 'forsyid', '']
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
                    'fill-color': highlightStyles.selectedAreaFillColor,    // Use style from highlightStyles
                    'fill-opacity': highlightStyles.selectedAreaOpacity     // Use style from highlightStyles
                },
                filter: ['in', 'forsyid', '']
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