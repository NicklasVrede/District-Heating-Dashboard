import { focusState } from './focusLayers/FocusState.js';
import { updateGraph } from '../../graphs/graphManager.js';

let focusManager; // Will be set through initialization

export function initMapFocusDropdown(mapFocusManager) {
    focusManager = mapFocusManager; // Store the focus manager instance
    
    const button = document.querySelector('.map-focus-button');
    const dropdown = document.createElement('div');
    dropdown.className = 'map-focus-dropdown';
     
    const options = [
        { value: 'none', label: 'None' },
        { value: 'overview', label: 'Overview' },
        { value: 'price', label: 'Price (MWh)' },
        { value: 'production', label: 'Production' }
    ];
    
    function hideDropdown() {
        dropdown.classList.remove('show');
    }
    
    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'map-focus-option';
        div.textContent = option.label;
        div.dataset.value = option.value;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            changeFocus(option.value);
            button.querySelector('span').textContent = option.value === 'none' ? 'Map Focus' : option.label;
            dropdown.querySelectorAll('.map-focus-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.value === option.value);
            });
            hideDropdown();
        });
        
        dropdown.appendChild(div);
    });
    
    button.appendChild(dropdown);

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', hideDropdown);
}

export function changeFocus(value) {
    const measureContainer = document.getElementById('measure-container');
    
    if (!measureContainer) {
        console.warn('Measure container not found');
        return;
    }

    // Update the global focus state
    focusState.focus = value;

    // First, hide measure container by default
    measureContainer.classList.remove('visible');
    measureContainer.classList.add('hidden');

    // If no focus or none selected, just apply the focus change
    if (!value || value === 'none') {
        focusManager.changeFocus(value);
        return;
    }

    // Show/hide containers based on focus
    if (value === 'production') {
        measureContainer.classList.remove('hidden');
        measureContainer.classList.add('visible');
    }

    // Apply the focus change and update graphs
    focusManager.changeFocus(value);
    updateGraph();
} 