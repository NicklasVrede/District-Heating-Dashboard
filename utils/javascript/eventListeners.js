import { highlightStyles } from '/styles/highlightStyles.js';

// EDIT STYLES IN "styles/highlightStyles.js".


let isHoveringPlant = false;
let areaTooltip = null;

export function addPlantEventListeners(map) {
    const plantTooltip = document.createElement('div');
    plantTooltip.className = 'mapboxgl-popup mapboxgl-popup-anchor-top';
    plantTooltip.style.position = 'absolute';
    plantTooltip.style.pointerEvents = 'none';
    plantTooltip.style.visibility = 'hidden';
    document.body.appendChild(plantTooltip);

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
            plantTooltip.innerHTML = `<div class="mapboxgl-popup-content"><strong>${feature.properties.name}</strong><br/>Forsyid: ${feature.properties.forsyid}</div>`;
            plantTooltip.style.visibility = 'visible';
        }
    });

    map.on('mousemove', 'plants', (e) => {
        plantTooltip.style.left = `${e.originalEvent.pageX + 5}px`;
        plantTooltip.style.top = `${e.originalEvent.pageY + 5}px`;
    });

    map.on('mouseleave', 'plants', () => {
        isHoveringPlant = false;
        map.getCanvas().style.cursor = '';
        resetAreaHighlight(map);
        removePlantHighlight(map);
        plantTooltip.style.visibility = 'hidden';
    });

    map.on('click', 'plants', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['plants'] });
        if (features.length) {
            const feature = features[0];
            toggleSelection(map, feature.properties.forsyid);
        }
    });
}

export function addAreaEventListeners(map) {
    areaTooltip = document.createElement('div');
    areaTooltip.className = 'mapboxgl-popup mapboxgl-popup-anchor-top';
    areaTooltip.style.position = 'absolute';
    areaTooltip.style.pointerEvents = 'none';
    areaTooltip.style.visibility = 'hidden';
    document.body.appendChild(areaTooltip);

    map.on('mouseenter', 'areas', (e) => {
        if (!isHoveringPlant) {
            map.getCanvas().style.cursor = 'pointer';
            const features = map.queryRenderedFeatures(e.point, { layers: ['areas'] });
            if (features.length) {
                const feature = features[0];
                highlightPlant(map, feature.properties.forsyid);
                highlightArea(map, feature.properties.forsyid);
                areaTooltip.innerHTML = `<div class="mapboxgl-popup-content"><strong>${feature.properties.forsytekst}</strong><br/>Forsyid: ${feature.properties.forsyid}</div>`;
                areaTooltip.style.visibility = 'visible';
            }
        }
    });

    map.on('mousemove', 'areas', (e) => {
        if (!isHoveringPlant) {
            areaTooltip.style.left = `${e.originalEvent.pageX + 5}px`;
            areaTooltip.style.top = `${e.originalEvent.pageY + 5}px`;
        }
    });

    map.on('mouseleave', 'areas', () => {
        if (!isHoveringPlant) {
            map.getCanvas().style.cursor = '';
            removePlantHighlight(map);
            resetAreaHighlight(map);
            areaTooltip.style.visibility = 'hidden';
        }
    });

    map.on('click', 'areas', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['areas'] });
        if (features.length) {
            const feature = features[0];
            toggleSelection(map, feature.properties.forsyid);
        }
    });
}

function highlightArea(map, forsyid) {
    map.setPaintProperty('areas', 'fill-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaFillColor, // Highlight color
        highlightStyles.areaDefaultFillColor  // Default color
    ]);
    map.setPaintProperty('areas-border', 'line-color', [
        'case',
        ['==', ['get', 'forsyid'], forsyid],
        highlightStyles.areaBorderColor, // Highlight color
        highlightStyles.areaDefaultBorderColor  // Default color (blue)
    ]);
}

function resetAreaHighlight(map) {
    map.setPaintProperty('areas', 'fill-color', highlightStyles.areaDefaultFillColor); // Reset to default color
    map.setPaintProperty('areas-border', 'line-color', highlightStyles.areaDefaultBorderColor); // Reset to default color (blue)
}

function highlightPlant(map, forsyid) {
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], forsyid]);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-color', highlightStyles.plantStrokeColor);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantOpacity);
}

function removePlantHighlight(map) {
    map.setFilter('highlighted-plant', ['==', ['get', 'forsyid'], '']);
    map.setPaintProperty('highlighted-plant', 'circle-stroke-width', highlightStyles.plantDefaultStrokeWidth);
    map.setPaintProperty('highlighted-plant', 'circle-blur', highlightStyles.plantDefaultBlur);
    map.setPaintProperty('highlighted-plant', 'circle-opacity', highlightStyles.plantDefaultOpacity);
}

function toggleSelection(map, forsyid) {
    console.log(`Toggled selection for forsyid: ${forsyid}`);
}