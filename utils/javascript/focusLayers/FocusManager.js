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
import { yearState } from './YearState.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';

class FocusManager {
    constructor() {
        this.measureContainer = document.getElementById('measure-container');
        this.initialized = false;
        this.currentFocus = null;
        this.initialize();
        this.initializeSelectDropdown();
        this.initializeMeasureDropdown();
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
        
        if (selectDropdown) {
            selectDropdown.addEventListener('change', (e) => {
                if (focusState.focus === 'price') {
                    if (this.currentFocus instanceof PriceFocus) {
                        this.handlePriceSelection(e.target.value);
                    }
                } else if (focusState.focus === 'production') {
                    if (this.currentFocus instanceof ProductionFocus) {
                        this.handleProductionSelection(e.target.value);
                    }
                }
            });
        }
    }

    initializeMeasureDropdown() {
        const measureSelector = document.getElementById('measure-selector');
        if (measureSelector) {
            measureSelector.addEventListener('change', () => {
                const selectValue = document.getElementById('select-dropdown').value;
                if (selectValue !== 'none') {
                    this.handleProductionSelection(selectValue);
                }
            });
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
                selectedIds = this.currentFocus.getTopNByPrice(5);
                break;
            case 'top10':
                selectedIds = this.currentFocus.getTopNByPrice(10);
                break;
            case 'bottom5':
                selectedIds = this.currentFocus.getBottomNByPrice(5);
                break;
            case 'bottom10':
                selectedIds = this.currentFocus.getBottomNByPrice(10);
                break;
            case 'all':
                selectAll(this.mapboxMap);
                break;
            case 'none':
                selectionSet.clear();
                updateSelectedPlants(this.mapboxMap);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
                return;
        }


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

    handleProductionSelection(value) {
        console.log('=== Production Selection Details ===');
        console.log('Selection type:', value);
        
        if (!this.currentFocus || !(this.currentFocus instanceof ProductionFocus)) {
            console.warn('Invalid focus state for production selection');
            return;
        }

        const measureType = document.getElementById('measure-selector').value;
        console.log('Measure type:', measureType);
        
        let selectedIds = [];

        switch (value) {
            case 'top5':
                selectedIds = this.currentFocus.getTopNByProduction(5, measureType);
                break;
            case 'top10':
                selectedIds = this.currentFocus.getTopNByProduction(10, measureType);
                break;
            case 'bottom5':
                selectedIds = this.currentFocus.getBottomNByProduction(5, measureType);
                break;
            case 'bottom10':
                selectedIds = this.currentFocus.getBottomNByProduction(10, measureType);
                break;
            case 'all':
                selectedIds = this.currentFocus.getAllByProduction(measureType);
                break;
            case 'none':
                console.log('Clearing all selections');
                selectionSet.clear();
                updateSelectedPlants(this.mapboxMap);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
                return;
        }

        console.log('Selected plant IDs:', selectedIds);
        console.log('Number of selections:', selectedIds.length);

        if (selectedIds.length > 0) {
            selectionSet.clear();
            selectedIds.forEach(id => selectionSet.add(id));
            updateSelectedPlants(this.mapboxMap);
            updateSelectedPlantsWindow(selectionSet);
            updateGraph();
        } else {
            console.warn('No plants found matching the selection criteria');
        }
    }

    changeFocus(value = 'none') {
        if (!this.initialized) {
            console.warn('FocusManager not yet initialized');
            return;
        }

        // Check if municipalities are visible
        if (municipalitiesVisible) {
            console.log('Municipalities are visible, no action taken.');
            return; // Do nothing if municipalities are visible
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
                selectGroup.style.display = (value === 'price' || value === 'production') ? 'flex' : 'none';
            }

            // Update year slider visibility based on focus and selection count
            const hasThreeOrMoreSelections = selectionSet.size >= 3;
            yearState.visible = hasThreeOrMoreSelections || value === 'price' || value === 'production';

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
            yearState.visible = selectionSet.size >= 3;
        }
    }
}

export { FocusManager }; 