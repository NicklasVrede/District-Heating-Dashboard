import { focusState } from './focusLayers/FocusState.js';
import { yearState } from './focusLayers/YearState.js';
import { selectionSet } from '../../main.js';
import { updateSelectedMunicipalities, updateSelectedPlants } from './eventListeners.js';
import { updateGraph } from './plotlyGraphs.js';
import { highlightArea, resetAreaHighlight, highlightPlant, removePlantHighlight } from './eventListeners.js';



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
            <span>Selected Plants</span>
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
            // First, check in the plants layer
            const plantFeature = source._data.features.find(f => 
                f.properties.forsyid === forsyid
            );

            
            if (!plantFeature) {
                // If not found in plants, check in municipalities
                const municipalityFeature = map.queryRenderedFeatures({ layers: ['municipalities-fill'] }).find(f => 
                    f.properties.lau_1 === forsyid // Assuming lau_1 is the property to match
                );

                
                if (!municipalityFeature) {
                    console.warn(`No feature found for forsyid: ${forsyid} in both plants and municipalities.`);
                    return null;
                }

                // If found in municipalities, use its properties
                const currentPrice = window.dataDict?.[forsyid]?.prices?.[yearState.year]?.mwh_price || 0;

                return {
                    forsyid,
                    name: municipalityFeature.properties.name || 'Unknown Municipality', // Adjusted for municipality
                    price: currentPrice
                };
            }

            // If found in plants, use its properties
            const currentPrice = window.dataDict?.[forsyid]?.prices?.[yearState.year]?.mwh_price || 0;

            return {
                forsyid,
                name: plantFeature.properties.name || 'Unknown Plant',
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
            }
        });

        li.addEventListener('mouseleave', () => {
            if (map) {
                resetAreaHighlight(map);
                removePlantHighlight(map);
            }
        });

        // Add click handler for delete button
        const deleteButton = li.querySelector('.delete-button');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const forsyid = e.target.dataset.forsyid;
                selectionSet.delete(forsyid);
                updateSelectedPlants(map);
                updateSelectedMunicipalities(map);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
            });
        }

        // Add click handler for the list item
        li.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                const forsyid = plant.forsyid;
                selectionSet.delete(forsyid);
                updateSelectedPlants(map);
                updateSelectedMunicipalities(map);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
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
            const graphContainer = document.getElementById('graph-container');
            if (graphContainer) {
                graphContainer.innerHTML = '';
            }
            setTimeout(() => {
                updateGraph(selectionSet);
            }, 100);
        });
    }
} 