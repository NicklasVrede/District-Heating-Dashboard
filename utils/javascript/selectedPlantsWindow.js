import { focusState } from './focusLayers/FocusState.js';
import { yearState } from './focusLayers/YearState.js';
import { selectionSet } from '../../main.js';
import { updateSelectedMunicipalities, updateSelectedPlants } from './eventListeners.js';
import { updateGraph } from './plotlyGraphs.js';
import { highlightArea, resetAreaHighlight, highlightPlant, removePlantHighlight } from './eventListeners.js';
import { clearGraph } from './clearGraph.js';
import { municipalitiesVisible } from './municipalitiesFunctions.js';
import { modifySelection } from './selectionFunctions.js';
import { highlightStyles } from '../../styles/highlightStyles.js';
import { getCachedData } from './dataManager.js';



// Initialize focus and year listeners
focusState.addListener(() => {
    if (selectionSet.size > 0) {
        updateSelectedPlantsWindow();
    }
});

// Add year state listener
yearState.addListener(() => {
    if (selectionSet.size > 0 && focusState.focus === 'price') {
        updateSelectedPlantsWindow();
    }
});

export function updateSelectedPlantsWindow() {
    const windowEl = document.getElementById('selected-plants-window');
    const list = document.getElementById('selected-plants-list');
    const map = window.map;
    
    if (!windowEl || !list || !map) return;

    // Show/hide window based on selection
    windowEl.style.display = selectionSet.size > 0 ? 'block' : 'none';
    
    if (selectionSet.size === 0) return;

    // Clear current list
    list.innerHTML = '';

    // First, update the header of the window (not the list items)
    windowEl.querySelector('.selected-plants-header').innerHTML = `
        <div class="header-content">
            <span>${municipalitiesVisible ? 'Selected Municipalities' : 'Selected Plants'}</span>
            <span class="plant-count">(${selectionSet.size})</span>
        </div>
        <button id="window-clear-button" title="Clear Selection">×</button>
    `;

    // Get plants data and create list items
    const source = map.getSource('plants');
    if (!source || !source._data) {
        console.warn('Plants source not found or data not loaded');
        return;
    }

    // Get plants data from map source
    const plants = Array.from(selectionSet)
        .map(forsyid => {
            const dataDict = getCachedData();
            if (!dataDict?.[forsyid]) {
                console.warn(`No data found for forsyid: ${forsyid} in dataDict`);
                return null;
            }

            const currentPrice = dataDict[forsyid]?.prices?.[yearState.year]?.mwh_price || 0;
            
            return {
                forsyid,
                name: dataDict[forsyid].name || 'Unknown',
                price: currentPrice
            };
        })
        .filter(plant => plant !== null);

    // Sort plants if price focus is active
    if (focusState.focus === 'price') {
        plants.sort((a, b) => b.price - a.price);
    }

    // Create list items
    plants.forEach(plant => {
        const li = document.createElement('li');
        li.className = 'selected-plant-item';
        
        const priceDisplay = focusState.focus === 'price' && plant.price > 0
            ? `<span class="plant-price">${plant.price.toFixed(0)} DKK</span>`
            : '';
            
        li.innerHTML = `
            <div class="plant-info">
                <span class="plant-name">${plant.name}</span>
                ${priceDisplay}
            </div>
            <span class="delete-button" data-forsyid="${plant.forsyid}">×</span>
        `;
        
        // Add hover handlers for highlighting
        li.addEventListener('mouseenter', () => {
            if (map) {
                highlightArea(map, plant.forsyid);
                highlightPlant(map, plant.forsyid);
                map.setPaintProperty('municipalities-selected-line', 'line-color', [
                    'case',
                    ['==', ['get', 'lau_1'], plant.forsyid],
                    highlightStyles.municipalityHover.lineColor,
                    highlightStyles.selectedMunicipalitiesLine.paint['line-color']
                ]);
                map.setPaintProperty('municipalities-selected-line', 'line-width', [
                    'case',
                    ['==', ['get', 'lau_1'], plant.forsyid],
                    highlightStyles.municipalityHover.lineWidth,
                    highlightStyles.selectedMunicipalitiesLine.paint['line-width']
                ]);
            }
        });

        li.addEventListener('mouseleave', () => {
            if (map) {
                resetAreaHighlight(map);
                removePlantHighlight(map);
                map.setPaintProperty('municipalities-selected-line', 'line-color', 
                    highlightStyles.selectedMunicipalitiesLine.paint['line-color']
                );
                map.setPaintProperty('municipalities-selected-line', 'line-width',
                    highlightStyles.selectedMunicipalitiesLine.paint['line-width']
                );
            }
        });

        // Add click handler for delete button
        const deleteButton = li.querySelector('.delete-button');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const forsyid = e.target.dataset.forsyid;
                modifySelection(map, forsyid, 'remove');
            });
        }

        // Add click handler for the list item
        li.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                const forsyid = plant.forsyid;
                modifySelection(map, forsyid, 'remove');
            } else {
                // Get plant coordinates from the map source
                const plantsSource = map.getSource('plants');
                const plantFeature = plantsSource._data.features.find(
                    feature => feature.properties.forsyid === plant.forsyid
                );

                if (plantFeature) {
                    // Find all features with the same forsyid
                    const connectedFeatures = plantsSource._data.features.filter(
                        feature => feature.properties.forsyid === plant.forsyid
                    );

                    if (connectedFeatures.length === 1) {
                        // Single entity - fly to it directly
                        map.flyTo({
                            center: plantFeature.geometry.coordinates,
                            zoom: 10,
                            speed: 1.2,
                            curve: 1.42,
                            easing: (t) => t
                        });
                    } else {
                        // Multiple connected entities - fit bounds to show all
                        const coordinates = connectedFeatures.map(f => f.geometry.coordinates);
                        const bounds = coordinates.reduce((bounds, coord) => {
                            return bounds.extend(coord);
                        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                        map.fitBounds(bounds, {
                            padding: 100,
                            speed: 1.2,
                            curve: 1.42,
                            easing: (t) => t
                        });
                    }
                }
            }
        });
        
        list.appendChild(li);
    });

    // Add the click handler for the clear button
    const clearButton = windowEl.querySelector('#window-clear-button');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            selectionSet.clear();
            updateSelectedPlants(map);
            updateSelectedMunicipalities(map);
            updateSelectedPlantsWindow();
            clearGraph();
            setTimeout(() => {
                updateGraph(selectionSet);
            }, 100);
        });
    }
} 