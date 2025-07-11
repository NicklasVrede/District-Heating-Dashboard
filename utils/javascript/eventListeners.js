import { highlightStyles } from '../../styles/highlightStyles.js';
import { selectionSet } from '../../main.js';
import { areaStyles } from '../../styles/areaStyles.js';
import { focusState } from './focusLayers/FocusState.js';
import { yearState } from './focusLayers/YearState.js';
import { modifySelection } from './selectionFunctions.js';
import { getNetworkSplitState } from './networkSplit.js';

let isHoveringPlant = false;
let areaTooltip = null;

// Helper function to format fuel type
export function formatFuelType(fuel) {
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
            highlightConnectedAreas(map, feature);
            plantTooltip.innerHTML = `
                <div class="mapboxgl-popup-content tooltip-content">
                    <h3 class="tooltip-title">${feature.properties.name}</h3>
                    <div class="tooltip-body">
                        <div class="tooltip-row">
                            <span class="tooltip-label">Main fuel:</span>
                            <span class="tooltip-value">${formatFuelType(feature.properties.currentMainFuel, feature.properties)}</span>
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
        map.setLayoutProperty('connected-areas', 'visibility', 'none');
    });

    // Event listener for clicking on a plant
    map.on('click', 'plants', (e) => {
        e.preventDefault();
        const isCtrlPressed = e.originalEvent.ctrlKey;
        const isMetaPressed = e.originalEvent.metaKey;
        const features = map.queryRenderedFeatures(e.point, { layers: ['plants'] });
        if (features.length) {
            const feature = features[0];
            //const properties = feature.properties;
            //console.log('Plant feature details:', {
            //    name: properties.navn1203,
            //    type: properties.type1203,
            //    value: properties.vaerdi1203,
            //    forsyid: properties.forsyid,
            //    forsytekst: properties.forsytekst,
            //    fv_net: properties.fv_net,
            //    cvr: properties.cvr_kode,
            //    cvrName: properties.cvrname
            //});
            modifySelection(map, feature.properties.forsyid, isCtrlPressed || isMetaPressed ? 'remove' : 'add');
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
                highlightConnectedAreas(map, feature);
                areaTooltip.innerHTML = `
                    <div class="mapboxgl-popup-content tooltip-content">
                        <h3 class="tooltip-title">${feature.properties.forsytekst}</h3>
                        <div class="tooltip-body">
                            <!-- Temporarily commented out navn1203 display
                            <div class="tooltip-row">
                                <span class="tooltip-label">Name:</span>
                                <span class="tooltip-value">${feature.properties.navn1203 || 'N/A'}</span>
                            </div>
                            -->
                            <div class="tooltip-row">
                                <span class="tooltip-label">Main fuel:</span>
                                <span class="tooltip-value">${plantData ? formatFuelType(plantData.currentMainFuel, plantData) : 'unknown'}</span>
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
            map.setLayoutProperty('connected-areas', 'visibility', 'none');
        }
    });

    // Event listener for clicking on an area
    map.on('click', 'areas', (e) => {
        if (!isHoveringPlant) {
            const isCtrlPressed = e.originalEvent.ctrlKey;
            const isMetaPressed = e.originalEvent.metaKey;
            const features = map.queryRenderedFeatures(e.point, { layers: ['areas'] });
            if (features.length) {
                const feature = features[0];
                const properties = feature.properties;
                console.log('Area feature details:', {
                    name: properties.navn1203,
                    type: properties.type1203,
                    value: properties.vaerdi1203,
                    forsyid: properties.forsyid,
                    forsytekst: properties.forsytekst,
                    fv_net: properties.fv_net,
                    cvr: properties.cvr_kode,
                    cvrName: properties.cvrname
                });
                modifySelection(map, feature.properties.forsyid, isCtrlPressed || isMetaPressed ? 'remove' : 'add');
            }
        }
    });
}

export function highlightArea(map, forsyid) {
    // Get the fv_net value for this forsyid
    const features = map.queryRenderedFeatures({ layers: ['areas'] });
    const feature = features.find(f => f.properties.forsyid === forsyid);
    const fv_net = feature?.properties?.fv_net;
    const isNetworkSplit = getNetworkSplitState();

    // Highlight the area fill
    map.setPaintProperty('areas', 'fill-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaFillColor,
        areaStyles.fill.paint['fill-color']
    ]);
    
    // Highlight the area border
    map.setPaintProperty('areas-border', 'line-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        '#ff9999',
        areaStyles.line.paint['line-color']
    ]);

    if (!isNetworkSplit && fv_net && fv_net !== '0' && fv_net !== '') {
        // Use fv_net for merged networks (only when fv_net exists and is valid)
        map.setPaintProperty('area-connections', 'line-color', [
            'case',
            ['==', ['get', 'fv_net'], fv_net],
            '#ff9999',
            '#6666ff'  // Default color
        ]);

        map.setPaintProperty('area-connections', 'line-opacity', [
            'case',
            ['==', ['get', 'fv_net'], fv_net],
            0.8,
            0.4  // Default opacity
        ]);

        // Highlight the plant connections (dotted lines) for the same network
        map.setPaintProperty('plant-connections', 'line-color', [
            'case',
            ['==', ['get', 'fv_net'], fv_net],
            '#ff9999',
            '#0000ff'  // Default color
        ]);

        map.setPaintProperty('plant-connections', 'line-opacity', [
            'case',
            ['==', ['get', 'fv_net'], fv_net],
            0.8,
            0.7  // Default opacity
        ]);
    } else {
        // Use forsyid when networks are split or when fv_net is invalid/empty/undefined
        map.setPaintProperty('area-connections', 'line-color', [
            'case',
            ['==', ['get', 'forsyid'], forsyid],
            '#ff9999',
            '#6666ff'  // Default color
        ]);

        map.setPaintProperty('area-connections', 'line-opacity', [
            'case',
            ['==', ['get', 'forsyid'], forsyid],
            0.8,
            0.4  // Default opacity
        ]);

        // Reset plant connections to default
        map.setPaintProperty('plant-connections', 'line-color', '#0000ff');
        map.setPaintProperty('plant-connections', 'line-opacity', 0.7);
    }

    // Also highlight connected areas using existing function
    highlightConnectedAreas(map, feature);
}

export function resetAreaHighlight(map) {
    // Reset area fill and border to default styles
    map.setPaintProperty('areas', 'fill-color', areaStyles.fill.paint['fill-color']);
    map.setPaintProperty('areas-border', 'line-color', areaStyles.line.paint['line-color']);
    
    // Reset area connections to default styles
    map.setPaintProperty('area-connections', 'line-color', '#6666ff');
    map.setPaintProperty('area-connections', 'line-opacity', 0.4);

    // Reset plant connections to default styles
    map.setPaintProperty('plant-connections', 'line-color', '#0000ff');
    map.setPaintProperty('plant-connections', 'line-opacity', 0.7);
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
    const filters = ['in', 'forsyid'];
    selectionSet.forEach(forsyid => {
        filters.push(forsyid);
    });
    
    map.setFilter('selected-plants', filters);
    map.setFilter('selected-areas', filters);

    const isNetworkSplit = getNetworkSplitState();
    const features = map.querySourceFeatures('areas', {
        filter: filters
    });

    if (!isNetworkSplit) {
        // For merged networks, use fv_net (only when it exists and is valid)
        const validNetworks = new Set();
        const individualIds = new Set();

        features.forEach(feature => {
            const fv_net = feature.properties.fv_net;
            if (fv_net && fv_net !== '0' && fv_net !== '') {
                validNetworks.add(fv_net);
            } else {
                individualIds.add(feature.properties.forsyid);
            }
        });

        // Create a combined filter for both networked and individual connections
        const connectionFilter = ['any'];
        
        // Add network-based conditions
        if (validNetworks.size > 0) {
            connectionFilter.push(['in', ['get', 'fv_net'], ['literal', Array.from(validNetworks)]]);
        }
        
        // Add individual area conditions
        if (individualIds.size > 0) {
            connectionFilter.push(['in', ['get', 'forsyid'], ['literal', Array.from(individualIds)]]);
        }

        // Update both connection layers
        map.setFilter('selected-connections', connectionFilter);
        
        // Update plant connections if we have valid networks
        if (validNetworks.size > 0) {
            map.setFilter('selected-plant-connections', ['in', ['get', 'fv_net'], ['literal', Array.from(validNetworks)]]);
        } else {
            map.setFilter('selected-plant-connections', ['in', 'fv_net', '']);
        }
    } else {
        // For split networks, use forsyid
        map.setFilter('selected-connections', filters);
        map.setFilter('selected-plant-connections', ['in', 'fv_net', '']); // Hide plant connections when split
    }

    const hasMoreThanTwoSelections = selectionSet.size > 2;
    yearState.visible = hasMoreThanTwoSelections || ['price', 'production'].includes(focusState.focus);
}

function toggleSelection(map, forsyid, isCtrlPressed, isMetaPressed) {
    if (isCtrlPressed || isMetaPressed) {
        modifySelection(map, forsyid, 'remove');
    } else {
        modifySelection(map, forsyid, 'toggle');
    }
}

export function addMunicipalityEventListeners(map) {
    // Event listener for clicking on a municipality
    map.on('click', 'municipalities-fill', (e) => {
        const isCtrlPressed = e.originalEvent.ctrlKey;
        const isMetaPressed = e.originalEvent.metaKey;
        const features = map.queryRenderedFeatures(e.point, { layers: ['municipalities-fill'] });
        if (features.length) {
            const feature = features[0];
            modifySelection(map, feature.properties.lau_1, isCtrlPressed || isMetaPressed ? 'remove' : 'add');
        }
    });
}

function toggleMunicipalitySelection(forsyid, isCtrlPressed) {
    modifySelection(map, forsyid, isCtrlPressed ? 'remove' : 'add');
}

export function updateSelectedMunicipalities(map) {
    // Initialise an array with keywords for mapbox filter
    const filters = ['in', 'lau_1'];
    // Add all selected forsyids to the array
    selectionSet.forEach(forsyid => {
        filters.push(forsyid);
    });
    //map.setFilter('selected-municipalities-fill', filters);
    map.setFilter('municipalities-selected-line', filters);

    // Update visibility of selected municipalities
    const municipalitiesVisibility = selectionSet.size > 0 ? 'visible' : 'none';
    //map.setLayoutProperty('selected-municipalities-fill', 'visibility', municipalitiesVisibility);
    map.setLayoutProperty('municipalities-selected-line', 'visibility', municipalitiesVisibility);
    
    // Update year slider visibility based on selection count
    const hasMoreThanTwoSelections = selectionSet.size > 2;
    yearState.visible = hasMoreThanTwoSelections || ['price', 'production'].includes(focusState.focus);
}

function highlightConnectedAreas(map, feature) {
    let fv_net = feature.properties.fv_net?.toString();
    
    // Only proceed if we have a valid non-zero fv_net
    if (!fv_net || fv_net === '0') {
        map.setLayoutProperty('connected-areas', 'visibility', 'none');
        return;
    }

    // Create a Mapbox expression to find areas with matching fv_net
    const connectedFilter = [
        'all',
        ['==', ['get', 'fv_net'], fv_net],
        ['!=', ['get', 'forsyid'], feature.properties.forsyid]  // Exclude current area/plant
    ];
    
    map.setFilter('connected-areas', connectedFilter);
    map.setLayoutProperty('connected-areas', 'visibility', 'visible');
}