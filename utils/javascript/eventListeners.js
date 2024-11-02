import { highlightStyles } from '../../styles/highlightStyles.js';
import { selectionSet } from '../../main.js';

let isHoveringPlant = false;
let areaTooltip = null;

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
            highlightArea(map, feature.properties.forsyid);
            highlightPlant(map, feature.properties.forsyid);
            plantTooltip.innerHTML = `
                <div class="mapboxgl-popup-content">
                    <strong>${feature.properties.name}</strong><br/>
                    <span>Forsyid: ${feature.properties.forsyid}</span><br/>
                    <em>Click to select, Ctrl+Click to deselect</em>
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
                highlightPlant(map, feature.properties.forsyid);
                highlightArea(map, feature.properties.forsyid);
                areaTooltip.innerHTML = `
                    <div class="mapboxgl-popup-content">
                        <strong>${feature.properties.forsytekst}</strong><br/>
                        <span>Forsyid: ${feature.properties.forsyid}</span><br/>
                        <em>Click to select, Ctrl+Click to deselect</em>
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

function highlightArea(map, forsyid) {
    // Highlight the area with the given forsyid
    map.setPaintProperty('areas', 'fill-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaFillColor,
        highlightStyles.areaDefaultFillColor
    ]);
    // Highlight the border of the given area
    map.setPaintProperty('areas-border', 'line-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaBorderColor,
        highlightStyles.areaDefaultBorderColor
    ]);
}

function resetAreaHighlight(map) {
    // Reset the area highlight
    map.setPaintProperty('areas', 'fill-color', highlightStyles.areaDefaultFillColor); // Reset to default color
    map.setPaintProperty('areas-border', 'line-color', highlightStyles.areaDefaultBorderColor); // Reset to default color (blue)
}

function highlightPlant(map, forsyid) {
    // Highlight the plant with the given forsyid
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], forsyid]);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-color', highlightStyles.plantStrokeColor);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantOpacity);
}

function removePlantHighlight(map) {
    // Remove the plant highlight
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], '']);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantDefaultStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantDefaultBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantDefaultOpacity);
}

function updateSelectedPlants(map) {
    // Initialise an array with keywords for mapbox filter
    const filters = ['in', 'forsyid'];
    // Add all selected forsyids to the array
    selectionSet.forEach(forsyid => {
        filters.push(forsyid);
    });
    map.setFilter('selected-plants', filters);
    map.setFilter('selected-areas', filters);
}

function toggleSelection(map, forsyid, isCtrlPressed) {
    if (isCtrlPressed) {
        // Remove from selection if Ctrl key is pressed
        if (selectionSet.has(forsyid)) {
            selectionSet.delete(forsyid);
            console.log(`Removed selection for forsyid: ${forsyid}`);
        }
    } else {
        // Add to selection if Ctrl key is not pressed
        if (!selectionSet.has(forsyid)) {
            selectionSet.add(forsyid);
            console.log(`Added selection for forsyid: ${forsyid}`);
        }
    }
    updateSelectedPlants(map);
}