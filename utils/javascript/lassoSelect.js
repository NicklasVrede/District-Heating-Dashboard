import { selectionSet } from '../../main.js';
import { updateSelectedPlants } from './eventListeners.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { updateGraph } from '../../graphs/graphManager.js';
import { modifySelection } from './selectionFunctions.js';
import { municipalitiesVisible } from './municipalitiesFunctions.js';
import { updateSelectedMunicipalities } from './eventListeners.js';

let draw;
let isLassoActive = false;
let hint = null;

export function initializeLasso(map) {
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: false,
            trash: false
        },
        defaultMode: 'simple_select',
        styles: [
            {
                'id': 'gl-draw-polygon-fill',
                'type': 'fill',
                'filter': ['all', ['==', '$type', 'Polygon']],
                'paint': {
                    'fill-color': '#3388ff',
                    'fill-opacity': 0.1
                }
            },
            {
                'id': 'gl-draw-polygon-stroke',
                'type': 'line',
                'filter': ['all', ['==', '$type', 'Polygon']],
                'paint': {
                    'line-color': '#3388ff',
                    'line-width': 2
                }
            },
            {
                'id': 'gl-draw-line-active',
                'type': 'line',
                'filter': ['all',
                    ['==', '$type', 'LineString'],
                    ['==', 'active', 'true']
                ],
                'paint': {
                    'line-color': '#3388ff',
                    'line-width': 2
                }
            },
            {
                'id': 'gl-draw-polygon-midpoint',
                'type': 'circle',
                'filter': ['all',
                    ['==', '$type', 'Point'],
                    ['==', 'meta', 'midpoint']
                ],
                'paint': {
                    'circle-radius': 3,
                    'circle-color': '#3388ff'
                }
            }
        ]
    });

    // Add draw control but don't show it initially
    map.addControl(draw);
    draw.changeMode('simple_select');

    // Add event listener for when drawing is completed
    map.on('draw.create', handleLassoSelection);
    
    // Add event listener for when drawing is stopped
    map.on('draw.modechange', () => {
        if (hint) {
            hint.remove();
            hint = null;
        }
        document.removeEventListener('mousemove', updateHintPosition);
    });
}

function handleLassoSelection(e) {
    // Remove hint message
    if (hint) {
        hint.remove();
        hint = null;
    }
    document.removeEventListener('mousemove', updateHintPosition);
    
    const map = e.target;
    const lassoPolygon = e.features[0];
    
    if (municipalitiesVisible) {
        // For municipalities, check which polygons intersect with the lasso
        const selectedFeatures = map.queryRenderedFeatures({
            layers: ['municipalities-fill']
        });
        
        // Filter features that intersect with the lasso polygon
        const intersectingFeatures = selectedFeatures.filter(feature => {
            try {
                // Check if the municipality polygon intersects with the lasso
                return turf.booleanIntersects(feature.geometry, lassoPolygon.geometry);
            } catch (error) {
                console.warn('Error checking intersection:', error);
                return false;
            }
        });
        
        // Batch process all selections first
        intersectingFeatures.forEach(feature => {
            modifySelection(map, feature.properties.lau_1, 'add', false);
        });
        
        // Update UI
        updateSelectedMunicipalities(map);
    } else {
        // For plants (points), use existing point-in-polygon check
        const selectedFeatures = map.queryRenderedFeatures({
            layers: ['plants'],
            filter: ['within', lassoPolygon.geometry]
        });
        
        // Create a Set of unique forsyids
        const uniqueForsyids = new Set(
            selectedFeatures.map(feature => feature.properties.forsyid)
        );
        
        // Process only unique forsyids
        Array.from(uniqueForsyids).forEach(forsyid => {
            modifySelection(map, forsyid, 'add', false);
        });
        
        // Update UI
        updateSelectedPlants(map);
    }
    
    // Common updates
    updateSelectedPlantsWindow(selectionSet);
    updateGraph();
    
    // Change button styling to indicate completion
    const lassoButton = document.querySelector('.lasso-select-button');
    lassoButton.classList.remove('active');
    
    // Clear the drawing
    draw.deleteAll();
}

export function toggleLassoSelect() {
    isLassoActive = !isLassoActive;
    const lassoButton = document.querySelector('.lasso-select-button');
    
    if (isLassoActive) {
        draw.changeMode('draw_polygon');
        lassoButton.classList.add('active');
        document.addEventListener('keydown', handleLassoKeypress);
        document.addEventListener('mousemove', updateHintPosition);
        
        // Create hint message
        hint = document.createElement('div');
        hint.id = 'lasso-hint';
        hint.style.position = 'fixed';
        hint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        hint.style.color = 'white';
        hint.style.padding = '4px 8px';
        hint.style.borderRadius = '3px';
        hint.style.zIndex = '1000';
        hint.style.pointerEvents = 'none';
        hint.style.fontSize = '12px';
        hint.style.whiteSpace = 'nowrap';
        hint.textContent = 'Double-click to finish';
        document.body.appendChild(hint);
    } else {
        draw.changeMode('simple_select');
        draw.deleteAll();
        lassoButton.classList.remove('active');
        document.removeEventListener('keydown', handleLassoKeypress);
        document.removeEventListener('mousemove', updateHintPosition);
        
        // Remove hint if it exists
        if (hint) {
            hint.remove();
            hint = null;
        }
    }
}

function handleLassoKeypress(e) {
    if (e.key === 'Enter') {
        const feature = draw.getAll().features[0];
        if (feature) {
            handleLassoSelection({ target: draw._map, features: [feature] });
        }
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
        // Remove hint before clearing the lasso
        if (hint) {
            hint.remove();
            hint = null;
        }
        document.removeEventListener('mousemove', updateHintPosition);
        
        draw.deleteAll();
        toggleLassoSelect();
    }
}

function updateHintPosition(e) {
    if (hint) {
        // Position hint slightly above the cursor
        hint.style.left = (e.clientX + 10) + 'px';
        hint.style.top = (e.clientY - 30) + 'px';
    }
}
