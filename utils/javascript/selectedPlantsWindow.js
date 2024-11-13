import { focusState } from './focusLayers/FocusState.js';
import { yearState } from './focusLayers/YearState.js';
import { selectionSet } from '../../main.js';
import { updateSelectedPlants } from './eventListeners.js';
import { updateGraph } from './plotlyGraphs.js';
import { highlightArea, resetAreaHighlight, highlightPlant, removePlantHighlight } from './eventListeners.js';

// Initialize focus listener
focusState.addListener(() => {
    // Update the selection window when focus changes
    if (selectionSet.size > 0) {
        updateSelectedPlantsWindow(selectionSet);
    }
});

export function updateSelectedPlantsWindow(selectedForsyids) {
    const windowEl = document.getElementById('selected-plants-window');
    const list = document.getElementById('selected-plants-list');
    const map = window.map;
    
    if (!windowEl || !list || !map) return;

    // Show/hide window based on selection
    windowEl.style.display = selectedForsyids.size > 0 ? 'block' : 'none';
    
    if (selectedForsyids.size === 0) return;

    // Clear current list
    list.innerHTML = '';

    // Get the plants source
    const source = map.getSource('plants');
    if (!source || !source._data) {
        console.warn('Plants source not found or data not loaded');
        return;
    }

    // Get plants data from map source
    const plants = Array.from(selectedForsyids)
        .map(forsyid => {
            const feature = source._data.features.find(f => 
                f.properties.forsyid === forsyid
            );

            if (!feature) {
                console.warn(`No feature found for forsyid: ${forsyid}`);
                return null;
            }

            const currentPrice = window.dataDict?.[forsyid]?.prices?.[yearState.year]?.mwh_price || 0;

            return {
                forsyid,
                name: feature.properties.name || 'Unknown Plant',
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
            const map = window.map;
            if (map) {
                highlightArea(map, plant.forsyid);
                highlightPlant(map, plant.forsyid);
            }
        });

        li.addEventListener('mouseleave', () => {
            const map = window.map;
            if (map) {
                resetAreaHighlight(map);
                removePlantHighlight(map);
            }
        });

        // Add click handler for delete button
        const deleteButton = li.querySelector('.delete-button');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const forsyid = e.target.dataset.forsyid;
            selectionSet.delete(forsyid);
            updateSelectedPlants(map);
            updateSelectedPlantsWindow(selectionSet);
            updateGraph();
        });

        // Add click handler for the list item
        li.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                const forsyid = plant.forsyid;
                selectionSet.delete(forsyid);
                updateSelectedPlants(map);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
            }
        });
        
        list.appendChild(li);
    });
} 