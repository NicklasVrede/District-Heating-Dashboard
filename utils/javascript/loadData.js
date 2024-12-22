import { plantStyles } from '../../styles/plantStyles.js';
import { areaStyles, gasAreaStyles } from '../../styles/areaStyles.js'; // Import gas area styles
import { addPlantEventListeners, addAreaEventListeners, addMunicipalityEventListeners } from './eventListeners.js';
import { highlightStyles } from '../../styles/highlightStyles.js';
import { createMunicipalityTooltip } from './municipalityTooltip.js'; // Update import


export function loadPlants(map) {
    return fetch('data/plants.geojson')
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
        });
}

export function loadAreas(map) {
    return fetch('maps/areas.geojson')
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
                    'fill-color': highlightStyles.selectedAreaFillColor,
                    'fill-opacity': highlightStyles.selectedAreaOpacity
                },
                filter: ['in', 'forsyid', '']
            });

            // Add connected areas layer
            map.addLayer({
                id: 'connected-areas',
                type: 'line',
                source: 'areas',
                layout: {
                    'visibility': 'none'  // Hidden by default
                },
                paint: highlightStyles.connectedAreas.paint,
                filter: ['in', 'forsyid', ''] 
            });

            // Add event listeners for areas
            addAreaEventListeners(map);
        });
}

export function loadGasAreas(map) {
    return fetch('maps/gas_areas.geojson')
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

            // Add the fill layer for gas areas
            map.addLayer({
                id: 'gas-areas-fill',
                type: 'fill', // Ensure type is defined
                source: 'gas-areas',
                layout: {
                    'visibility': 'none' // Hide the fill layer by default
                },
                paint: {
                    'fill-color': gasAreaStyles.fill.paint['fill-color'],
                    'fill-opacity': gasAreaStyles.fill.paint['fill-opacity']
                }
            });

            // Add a border to the gas areas with custom styles, hidden by default
            map.addLayer({
                id: 'gas-areas-line',
                type: 'line', // Ensure type is defined
                source: 'gas-areas',
                layout: {
                    'visibility': 'none' // Hide the line layer by default
                },
                paint: {
                    'line-color': gasAreaStyles.line.paint['line-color'],
                    'line-width': gasAreaStyles.line.paint['line-width']
                }
            });
        });
}

export function loadMunicipalities(map) {
    return fetch('maps/municipalities_with_forsyid.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            // Add the GeoJSON source to the map
            map.addSource('municipalities', {
                type: 'geojson',
                data: geojson
            });

            // Add price layer first
            map.addLayer({
                id: 'municipalities-price',
                type: 'fill',
                source: 'municipalities',
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'fill-color': '#00ff00',
                    'fill-opacity': 0.5
                }
            });

            // Then add the highlight layers
            map.addLayer({
                id: 'selected-municipalities-fill',
                type: 'fill',
                source: 'municipalities',
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'fill-color': highlightStyles.selectedMunicipalitiesFill.paint['fill-color'],
                    'fill-opacity': highlightStyles.selectedMunicipalitiesFill.paint['fill-opacity']
                }
            });

            map.addLayer({
                id: 'municipalities-selected-line',
                type: 'line',
                source: 'municipalities',
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'line-color': highlightStyles.selectedMunicipalitiesLine.paint['line-color'],
                    'line-width': highlightStyles.selectedMunicipalitiesLine.paint['line-width']
                }
            });

            // Add a fill layer for the municipalities
            map.addLayer({
                id: 'municipalities-fill',
                type: 'fill',
                source: 'municipalities',
                layout: {
                    visibility: 'none' // Ensure visibility is set to visible
                },
                paint: {
                    'fill-color': areaStyles.municipalitiesFill.paint['fill-color'],
                    'fill-opacity': areaStyles.municipalitiesFill.paint['fill-opacity']
                }
            });

            // Add a line layer for the municipalities
            map.addLayer({
                id: 'municipalities-line',
                type: 'line',
                source: 'municipalities',
                layout: {
                    visibility: 'none' // Ensure visibility is set to visible
                },
                paint: {
                    'line-color': areaStyles.municipalitiesLine.paint['line-color'],
                    'line-width': areaStyles.municipalitiesLine.paint['line-width']
                }
            });

            // Add event listeners for municipalities
            addMunicipalityEventListeners(map);
            
            // Create the tooltip after layers are set up
            createMunicipalityTooltip(map);
        });
}

export function loadMunicipalityCentroids(map) {
    return fetch('maps/municipality_centroids.geojson')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(geojson => {
            // Add the centroids source
            map.addSource('municipality-centroids', {
                type: 'geojson',
                data: geojson
            });

            // Add the production visualization layer for centroids
            map.addLayer({
                id: 'municipalities-production',
                type: 'circle',
                source: 'municipality-centroids',
                layout: {
                    'visibility': 'none'
                },
                paint: {
                    'circle-color': '#888888',  // Default color, will be updated by ProductionFocus
                    'circle-radius': 5,         // Default size, will be updated by ProductionFocus
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'white',
                    'circle-opacity': 0.8
                }
            });
        });
}