import { getMapInstance } from '../mapInstance.js';
import { PriceFocus } from './PriceFocus.js';
import { ProductionFocus } from './ProductionFocus.js';
import { DefaultFocus } from './DefaultFocus.js';
import { focusState } from './FocusState.js';
import { selectAll } from '../selectionFunctions.js';
import { selectionSet } from '../../../main.js';
import { updateSelectedPlants } from '../eventListeners.js';
import { updateSelectedPlantsWindow } from '../selectedPlantsWindow.js';
import { updateGraph } from '../plotlyGraphs.js';

class FocusManager {
    constructor() {
        this.measureContainer = document.getElementById('measure-container');
        this.initialized = false;
        this.currentFocus = null;
        this.initialize();
        this.initializeSelectDropdown();
    }

    initialize() {
        const map = getMapInstance();
        if (!map?.loaded()) {
            setTimeout(() => this.initialize(), 100);
            return;
        }

        this.mapboxMap = map;
        this.focuses = {
            price: new PriceFocus(this.mapboxMap, this.measureContainer),
            production: new ProductionFocus(this.mapboxMap, this.measureContainer),
            none: new DefaultFocus(this.mapboxMap, this.measureContainer)
        };
        this.initialized = true;
        this.currentFocus = this.focuses.none;
    }

    initializeSelectDropdown() {
        const selectDropdown = document.getElementById('select-dropdown');
        console.log('Initializing select dropdown:', selectDropdown);
        
        if (selectDropdown) {
            selectDropdown.addEventListener('change', (e) => {
                console.log('=== Select Dropdown Event ===');
                console.log('Selected value:', e.target.value);
                console.log('Current focus state:', focusState.focus);
                console.log('Current focus instance:', this.currentFocus?.constructor.name);
                
                if (focusState.focus === 'price') {
                    if (this.currentFocus instanceof PriceFocus) {
                        console.log('Conditions met, handling price selection');
                        this.handlePriceSelection(e.target.value);
                    } else {
                        console.warn('Focus state is price but currentFocus is not PriceFocus');
                    }
                } else {
                    console.log('Not in price focus mode, ignoring selection');
                }
            });
            console.log('Event listener attached to select dropdown');
        } else {
            console.warn('Select dropdown element not found');
        }
    }

    handlePriceSelection(value) {
        console.log('=== Handle Price Selection ===');
        console.log('Selection value:', value);
        console.log('Price rankings available:', !!this.currentFocus?.priceRankings);
        
        if (!this.currentFocus || !(this.currentFocus instanceof PriceFocus)) {
            console.warn('Invalid focus state for price selection');
            return;
        }

        let selectedIds = [];
        switch (value) {
            case 'top5':
                console.log('Getting top 5');
                selectedIds = this.currentFocus.getTopNByPrice(5);
                break;
            case 'top10':
                console.log('Getting top 10');
                selectedIds = this.currentFocus.getTopNByPrice(10);
                break;
            case 'bottom5':
                console.log('Getting bottom 5');
                selectedIds = this.currentFocus.getBottomNByPrice(5);
                break;
            case 'bottom10':
                console.log('Getting bottom 10');
                selectedIds = this.currentFocus.getBottomNByPrice(10);
                break;
            case 'all':
                console.log('Getting all plants');
                selectedIds = Object.keys(this.currentFocus.priceRankings || {});
                break;
            case 'none':
                console.log('Clearing all selections');
                selectionSet.clear();
                updateSelectedPlants(this.mapboxMap);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
                return;
        }

        console.log('Selected IDs:', selectedIds);

        if (selectedIds.length > 0) {
            // Clear existing selections
            selectionSet.clear();
            
            // Add new selections
            selectedIds.forEach(id => {
                selectionSet.add(id);
            });

            // Update UI and graph
            updateSelectedPlants(this.mapboxMap);
            updateSelectedPlantsWindow(selectionSet);
            updateGraph();
        }
    }

    changeFocus(value = 'none') {
        if (!this.initialized) {
            console.warn('FocusManager not yet initialized');
            return;
        }

        console.log('FocusManager changing focus from', this.currentFocus?.constructor.name, 'to:', value);

        try {
            // Handle overview separately
            if (value === 'overview') {
                selectAll(this.mapboxMap);
                value = 'none'; // Reset to none after triggering overview
            }

            // Show/hide select group based on focus
            const selectGroup = document.querySelector('.select-group');
            if (selectGroup) {
                if (value === 'price' || value === 'production') {
                    selectGroup.style.display = 'flex';
                } else {
                    selectGroup.style.display = 'none';
                }
            }

            // Remove current focus
            if (this.currentFocus) {
                console.log('Removing current focus:', this.currentFocus.constructor.name);
                this.currentFocus.remove();
            }

            // Apply new focus
            const newFocus = this.focuses[value] || this.focuses.none;
            console.log('Applying new focus:', newFocus.constructor.name);
            newFocus.apply();
            this.currentFocus = newFocus;
            focusState.focus = value;
        } catch (error) {
            console.error('Error changing focus:', error);
            this.focuses.none.apply();
            this.currentFocus = this.focuses.none;
            focusState.focus = 'none';
        }
    }
}

export { FocusManager }; 