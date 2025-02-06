import { plantStyles } from '../../styles/plantStyles.js';
import { areaStyles, gasAreaStyles } from '../../styles/areaStyles.js'; // Import gas area styles
import { addPlantEventListeners, addAreaEventListeners, addMunicipalityEventListeners } from './eventListeners.js';
import { highlightStyles } from '../../styles/highlightStyles.js';
import { createMunicipalityTooltip } from './municipalityTooltip.js'; // Update import


export function loadPlants(map) {
    return fetch('data/plants_merged.geojson')
        .then(response => response.json())
        .then(geojson => {
            // Add the GeoJSON source to the map
            map.addSource('plants', {
                type: 'geojson',
                data: geojson
            });

            // Create connections source
            const connections = {
                type: 'FeatureCollection',
                features: createConnectionFeatures(geojson.features)
            };
            
            map.addSource('plant-connections', {
                type: 'geojson',
                data: connections
            });

            // Add connections layer for plants in same network.
            map.addLayer({
                id: 'plant-connections',
                type: 'line',
                source: 'plant-connections',
                layout: {
                    'visibility': 'visible'  // Changed from 'visible' to 'none'
                },
                paint: {
                    'line-color': '#0000ff',
                    'line-width': 2,
                    'line-dasharray': [3, 3],
                    'line-opacity': 0.7
                }
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

// Helper function to create connection features
function createConnectionFeatures(plants) {
    const connections = [];
    const maxDistance = 50; // Maximum distance in kilometers

    // Group plants by fv_net
    const networkGroups = {};
    plants.forEach(plant => {
        const netId = plant.properties.fv_net;
        if (netId && netId !== '0' && netId !== '') {
            if (!networkGroups[netId]) {
                networkGroups[netId] = [];
            }
            networkGroups[netId].push(plant);
        }
    });

    // Create connections within each network group
    Object.entries(networkGroups).forEach(([netId, group]) => {
        if (group.length < 2) return;

        if (netId === '79') {
            // For network 79, find the most central plant
            let centralPlant = group[0];
            let minTotalDistance = Infinity;

            // Calculate which plant has the minimum total distance to all other plants
            group.forEach(plant1 => {
                let totalDistance = 0;
                group.forEach(plant2 => {
                    if (plant1 !== plant2) {
                        totalDistance += calculateDistance(
                            plant1.geometry.coordinates[1],
                            plant1.geometry.coordinates[0],
                            plant2.geometry.coordinates[1],
                            plant2.geometry.coordinates[0]
                        );
                    }
                });
                if (totalDistance < minTotalDistance) {
                    minTotalDistance = totalDistance;
                    centralPlant = plant1;
                }
            });

            // Connect all other plants to the central plant
            group.forEach(plant => {
                if (plant !== centralPlant) {
                    connections.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                plant.geometry.coordinates,
                                centralPlant.geometry.coordinates
                            ]
                        },
                        properties: {
                            fv_net: netId,
                            distance: calculateDistance(
                                plant.geometry.coordinates[1],
                                plant.geometry.coordinates[0],
                                centralPlant.geometry.coordinates[1],
                                centralPlant.geometry.coordinates[0]
                            )
                        }
                    });
                }
            });
        } else {
            // Create all possible edges with distances
            const edges = [];
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const plant1 = group[i];
                    const plant2 = group[j];
                    
                    // Calculate distance between plants
                    const distance = calculateDistance(
                        plant1.geometry.coordinates[1],
                        plant1.geometry.coordinates[0],
                        plant2.geometry.coordinates[1],
                        plant2.geometry.coordinates[0]
                    );

                    // Only create connection if within maxDistance
                    if (distance <= maxDistance) {
                        edges.push({
                            plant1: i,
                            plant2: j,
                            distance: distance
                        });
                    }
                }
            }

            // Sort edges by distance
            edges.sort((a, b) => a.distance - b.distance);

            // Initialize disjoint set for MST
            const parent = Array(group.length).fill().map((_, i) => i);
            
            // Find set representative
            function find(x) {
                if (parent[x] !== x) {
                    parent[x] = find(parent[x]);
                }
                return parent[x];
            }
            
            // Union two sets
            function union(x, y) {
                parent[find(x)] = find(y);
            }

            // Create MST using Kruskal's algorithm
            edges.forEach(edge => {
                if (find(edge.plant1) !== find(edge.plant2)) {
                    union(edge.plant1, edge.plant2);
                    
                    // Add connection to result
                    connections.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                group[edge.plant1].geometry.coordinates,
                                group[edge.plant2].geometry.coordinates
                            ]
                        },
                        properties: {
                            fv_net: netId,
                            distance: edge.distance
                        }
                    });
                }
            });
        }
    });

    return connections;
}

// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export function loadAreas(map) {
    return fetch('maps/areas_merged.geojson')
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
                    'visibility': 'visible'  // Hidden by default
                },
                paint: highlightStyles.connectedAreas.paint,
                filter: ['in', 'forsyid', ''] 
            });

            // Add event listeners for areas
            addAreaEventListeners(map);
        });
}

// New function to load connection lines between areas!
export function loadConnectionLines(map) {
    return fetch('maps/area-connections.geojson')
        .then(response => response.json())
        .then(connections => {
            // Add source for the connections
            map.addSource('area-connections', {
                type: 'geojson',
                data: connections
            });

            // Add the connections layer
            map.addLayer({
                id: 'area-connections',
                type: 'line',
                source: 'area-connections',
                layout: {
                    'visibility': 'visible'
                },
                paint: {
                    'line-color': '#6666ff',
                    'line-width': 1.5,
                    'line-opacity': 0.4
                }
            });

            // Add the selected connections layer
            map.addLayer({
                id: 'selected-connections',
                type: 'line',
                source: 'area-connections',
                layout: {
                    'visibility': 'visible'
                },
                paint: {
                    'line-color': '#ff9999',
                    'line-width': 1.5,
                    'line-opacity': 0.8
                },
                filter: ['in', 'fv_net', '']  // Empty filter initially
            });
        })
        .catch(error => {
            console.warn('Error loading connections:', error);
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