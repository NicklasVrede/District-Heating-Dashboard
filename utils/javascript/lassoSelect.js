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
    
    // Add to selection set
    selectedFeatures.forEach(feature => {
        modifySelection(map, feature.properties.forsyid, 'add');
    });
    
    // Update UI
    updateSelectedPlants(map);
    updateSelectedPlantsWindow(selectionSet);
    updateGraph();
    
    // Change button styling to indicate completion
    const lassoButton = document.querySelector('.lasso-select-button');
    lassoButton.classList.remove('active'); // Remove active class
    lassoButton.classList.add('completed'); // Add completed class if needed

    // Clear the drawing
    draw.deleteAll();
}

export function toggleLassoSelect() {
    isLassoActive = !isLassoActive;
    
    if (isLassoActive) {
        draw.changeMode('draw_polygon');
        document.querySelector('.lasso-select-button').classList.add('active');
    } else {
        draw.changeMode('simple_select');
        draw.deleteAll();
        document.querySelector('.lasso-select-button').classList.remove('active');
    }
}
