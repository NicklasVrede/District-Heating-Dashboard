import { highlightStyles } from '../../styles/highlightStyles.js';
import { selectionSet } from '../../main.js';
import { updateGraph } from './plotlyGraphs.js'; // Corrected import path
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { areaStyles } from '../../styles/areaStyles.js';
import { focusState } from './focusLayers/FocusState.js';
import { yearState } from './focusLayers/YearState.js';

let isHoveringPlant = false;
let areaTooltip = null;

// Helper function to format fuel type
function formatFuelType(fuel) {
    // Handle undefined or null fuel types
    if (!fuel) {
        return 'Not specified';
    }

    // Dictionary for specific replacements
    const replacements = {
        'traepiller': 'Træpiller',
        'trae- og biomasseaffald': 'Træ- og biomasseaffald'
        // Add more replacements if needed
    };

    // Check if the fuel is in our replacement dictionary
    if (replacements[fuel]) {
        return replacements[fuel];
    }

    // If not in dictionary, just capitalize first letter
    return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

export function addPlantEventListeners(map) {
    // Create a tooltip for displaying plant information
    const plantTooltip = document.createElement('div');
    plantTooltip.className = 'mapboxgl-popup mapboxgl-popup-anchor-top';
    plantTooltip.style.position = 'absolute';
    plantTooltip.style.pointerEvents = 'none';
    plantTooltip.style.visibility = 'hidden';
    document.body.appendChild(plantTooltip);

    // Event listener for mouse entering a plant
    map.on('mouseenter', 'plants', (e) => {
        isHoveringPlant = true;
        if (areaTooltip) {
            areaTooltip.style.visibility = 'hidden';
        }
        map.getCanvas().style.cursor = 'pointer';
        const features = map.queryRenderedFeatures(e.point, { layers: ['plants'] });
        if (features.length) {
            const feature = features[0];
            const properties = feature.properties || {};
            
            highlightArea(map, properties.forsyid);
            highlightPlant(map, properties.forsyid);
            plantTooltip.innerHTML = `
                <div class="mapboxgl-popup-content tooltip-content">
                    <h3 class="tooltip-title">${feature.properties.name}</h3>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="tooltip-label">ID:</span>
                            <span class="tooltip-value">${feature.properties.forsyid}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Main fuel:</span>
                            <span class="tooltip-value">${formatFuelType(feature.properties.main_fuel)}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Supply area:</span>
                            <span class="tooltip-value">${feature.properties.total_area_km2} km²</span>
                        </div>
                    </div>
                    <div class="tooltip-footer">
                        <em>Click to select, Ctrl+Click to deselect</em>
                    </div>
                </div>`;
            plantTooltip.style.visibility = 'visible';
        }
    });

    // Event listener for mouse moving within a plant
    map.on('mousemove', 'plants', (e) => {
        plantTooltip.style.left = `${e.originalEvent.pageX + 5}px`;
        plantTooltip.style.top = `${e.originalEvent.pageY + 5}px`;
    });

    // Event listener for mouse leaving a plant
    map.on('mouseleave', 'plants', () => {
        isHoveringPlant = false;
        map.getCanvas().style.cursor = '';
        resetAreaHighlight(map);
        removePlantHighlight(map);
        plantTooltip.style.visibility = 'hidden';
    });

    // Event listener for clicking on a plant
    map.on('click', 'plants', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['plants'] });
        if (features.length) {
            const feature = features[0];
            toggleSelection(map, feature.properties.forsyid, e.originalEvent.ctrlKey);
        }
    });
}

export function addAreaEventListeners(map) {
    // Create a tooltip for displaying area information
    areaTooltip = document.createElement('div');
    areaTooltip.className = 'mapboxgl-popup mapboxgl-popup-anchor-top';
    areaTooltip.style.position = 'absolute';
    areaTooltip.style.pointerEvents = 'none';
    areaTooltip.style.visibility = 'hidden';
    document.body.appendChild(areaTooltip);

    // Event listener for mouse entering an area
    map.on('mouseenter', 'areas', (e) => {
        if (!isHoveringPlant) {
            map.getCanvas().style.cursor = 'pointer';
            const features = map.queryRenderedFeatures(e.point, { layers: ['areas'] });
            if (features.length) {
                const feature = features[0];
                // Query the plants layer to get the matching plant data
                const plantFeatures = map.querySourceFeatures('plants', {
                    sourceLayer: '',
                    filter: ['==', 'forsyid', feature.properties.forsyid]
                });
                
                const plantData = plantFeatures.length ? plantFeatures[0].properties : null;
                
                highlightPlant(map, feature.properties.forsyid);
                highlightArea(map, feature.properties.forsyid);
                areaTooltip.innerHTML = `
                    <div class="mapboxgl-popup-content tooltip-content">
                        <h3 class="tooltip-title">${feature.properties.forsytekst}</h3>
                        <div class="tooltip-body">
                            <div class="tooltip-row">
                                <span class="tooltip-label">ID:</span>
                                <span class="tooltip-value">${feature.properties.forsyid}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Main fuel:</span>
                                <span class="tooltip-value">${plantData ? formatFuelType(plantData.main_fuel) : 'unknown'}</span>
                            </div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">Supply area:</span>
                                <span class="tooltip-value">${plantData ? plantData.total_area_km2 : 'unknown'} km²</span>
                            </div>
                        </div>
                        <div class="tooltip-footer">
                            <em>Click to select, Ctrl+Click to deselect</em>
                        </div>
                    </div>`;
                areaTooltip.style.visibility = 'visible';
            }
        }
    });

    // Event listener for mouse moving within an area
    map.on('mousemove', 'areas', (e) => {
        if (!isHoveringPlant) {
            areaTooltip.style.left = `${e.originalEvent.pageX + 5}px`;
            areaTooltip.style.top = `${e.originalEvent.pageY + 5}px`;
        }
    });

    // Event listener for mouse leaving an area
    map.on('mouseleave', 'areas', () => {
        if (!isHoveringPlant) {
            map.getCanvas().style.cursor = '';
            removePlantHighlight(map);
            resetAreaHighlight(map);
            areaTooltip.style.visibility = 'hidden';
        }
    });

    // Event listener for clicking on an area
    map.on('click', 'areas', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['areas'] });
        if (features.length) {
            const feature = features[0];
            toggleSelection(map, feature.properties.forsyid, e.originalEvent.ctrlKey);
        }
    });
}

export function highlightArea(map, forsyid) {
    map.setPaintProperty('areas', 'fill-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaFillColor,          // Use the correct property name
        areaStyles.fill.paint['fill-color']     // Keep default color for others
    ]);
    
    map.setPaintProperty('areas-border', 'line-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaBorderColor,        // Use the correct property name
        areaStyles.line.paint['line-color']     // Keep default color for others
    ]);
}

export function resetAreaHighlight(map) {
    // Reset to default styles from areaStyles.js
    map.setPaintProperty('areas', 'fill-color', areaStyles.fill.paint['fill-color']);
    map.setPaintProperty('areas-border', 'line-color', areaStyles.line.paint['line-color']);
}

export function highlightPlant(map, forsyid) {
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], forsyid]);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-color', highlightStyles.plantStrokeColor);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantOpacity);
}

export function removePlantHighlight(map) {
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], '']);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantDefaultStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantDefaultBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantDefaultOpacity);
}

export function updateSelectedPlants(map) {
    // Initialise an array with keywords for mapbox filter
    const filters = ['in', 'forsyid'];
    // Add all selected forsyids to the array
    selectionSet.forEach(forsyid => {
        filters.push(forsyid);
    });
    map.setFilter('selected-plants', filters);
    map.setFilter('selected-areas', filters);

    // Update year slider visibility based on selection count
    const hasMoreThanTwoSelections = selectionSet.size > 2;
    yearState.visible = hasMoreThanTwoSelections || ['price', 'production'].includes(focusState.focus);
}

function toggleSelection(map, forsyid, isCtrlPressed) {
    if (isCtrlPressed) {
        // Remove from selection if Ctrl key is pressed
        if (selectionSet.has(forsyid)) {
            selectionSet.delete(forsyid);
        }
    } else {
        // Add to selection if Ctrl key is not pressed
        if (!selectionSet.has(forsyid)) {
            selectionSet.add(forsyid);
        }
    }
    updateSelectedPlants(map);
    updateSelectedPlantsWindow(selectionSet);

    // Clear graph if selection becomes empty
    if (selectionSet.size === 0) {
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.innerHTML = '';
        }
    }
    
    updateGraph(); // Update the graph whenever the selection changes
}