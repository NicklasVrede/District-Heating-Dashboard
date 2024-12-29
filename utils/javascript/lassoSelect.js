import { selectionSet } from '../../main.js';
import { updateSelectedPlants } from './eventListeners.js';
import { updateSelectedPlantsWindow } from './selectedPlantsWindow.js';
import { updateGraph } from '../../graphs/graphManager.js';
import { modifySelection } from './selectionFunctions.js';

let draw;
let isLassoActive = false;

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
}

function handleLassoSelection(e) {
    const map = e.target;
    const lassoPolygon = e.features[0];
    
    // Query features within the lasso polygon
    const selectedFeatures = map.queryRenderedFeatures({
        layers: ['plants'],
        filter: ['within', lassoPolygon.geometry]
    });
    
    // Batch process all selections first
    selectedFeatures.forEach(feature => {
        modifySelection(map, feature.properties.forsyid, 'add', false); // Add silent parameter to skip updates
    });
    
    // Then do a single update at the end
    updateSelectedPlants(map);
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
        // Add keyboard listeners when lasso is active
        document.addEventListener('keydown', handleLassoKeypress);
    } else {
        draw.changeMode('simple_select');
        draw.deleteAll();
        lassoButton.classList.remove('active');
        // Remove keyboard listeners when lasso is inactive
        document.removeEventListener('keydown', handleLassoKeypress);
    }
}

function handleLassoKeypress(e) {
    if (e.key === 'Enter') {
        // Finalize the selection
        const feature = draw.getAll().features[0];
        if (feature) {
            handleLassoSelection({ target: draw._map, features: [feature] });
        }
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
        // Cancel the selection
        draw.deleteAll();
        toggleLassoSelect();
    }
}
