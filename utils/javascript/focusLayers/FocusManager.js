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
import { updateSelectedMunicipalities } from '../eventListeners.js';
import { showToast } from '../../../graphs/components/toast.js';


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
            default: new DefaultFocus(this.mapboxMap, this.measureContainer)
        };
        this.initialized = true;
        this.currentFocus = this.focuses.default;
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
        if (!this.currentFocus || !(this.currentFocus instanceof PriceFocus)) {
            console.warn('Invalid focus state for price selection');
            return;
        }

        let selectedIds = [];
        let requestedCount = 0;

        switch (value) {
            case 'top5':
                requestedCount = 5;
                selectedIds = this.currentFocus.getTopNByPrice(5);
                break;
            case 'top10':
                requestedCount = 10;
                selectedIds = this.currentFocus.getTopNByPrice(10);
                break;
            case 'bottom5':
                requestedCount = 5;
                selectedIds = this.currentFocus.getBottomNByPrice(5);
                break;
            case 'bottom10':
                requestedCount = 10;
                selectedIds = this.currentFocus.getBottomNByPrice(10);
                break;
            case 'all':
                selectedIds = this.currentFocus.getAllByPrice();
                break;
            case 'none':
                selectionSet.clear();
                updateSelectedPlants(this.mapboxMap);
                updateSelectedMunicipalities(this.mapboxMap);
                updateSelectedPlantsWindow();
                updateGraph();
                return;
        }

        if (selectedIds.length > 0) {
            // Show toast if fewer items returned than requested
            if (requestedCount > 0 && selectedIds.length < requestedCount) {
                const entityType = municipalitiesVisible ? 'municipalities' : 'plants';
                showToast(`Only ${selectedIds.length} ${entityType} found with price data (requested ${requestedCount})`);
            }

            selectionSet.clear();
            selectedIds.forEach(id => selectionSet.add(id));
            
            if (municipalitiesVisible) {
                updateSelectedMunicipalities(this.mapboxMap);
            } else {
                updateSelectedPlants(this.mapboxMap);
            }
            
            updateSelectedPlantsWindow();
            updateGraph();
        } else {
            showToast('No items found matching the selection criteria');
        }
    }

    handleProductionSelection(value) {
        if (!this.currentFocus || !(this.currentFocus instanceof ProductionFocus)) {
            console.warn('Invalid focus state for production selection');
            return;
        }

        let selectedIds = [];
        let requestedCount = 0;
        const measureType = document.getElementById('measure-selector').value;

        switch (value) {
            case 'top5':
                requestedCount = 5;
                selectedIds = this.currentFocus.getTopNByProduction(5, measureType);
                break;
            case 'top10':
                requestedCount = 10;
                selectedIds = this.currentFocus.getTopNByProduction(10, measureType);
                break;
            case 'bottom5':
                requestedCount = 5;
                selectedIds = this.currentFocus.getBottomNByProduction(5, measureType);
                break;
            case 'bottom10':
                requestedCount = 10;
                selectedIds = this.currentFocus.getBottomNByProduction(10, measureType);
                break;
            case 'all':
                selectedIds = this.currentFocus.getAllByProduction(measureType);
                break;
            case 'none':
                selectionSet.clear();
                updateSelectedPlants(this.mapboxMap);
                updateSelectedPlantsWindow(selectionSet);
                updateGraph();
                return;
        }

        if (selectedIds.length > 0) {
            // Show toast if fewer items returned than requested
            if (requestedCount > 0 && selectedIds.length < requestedCount) {
                const entityType = municipalitiesVisible ? 'municipalities' : 'plants';
                showToast(`Only ${selectedIds.length} ${entityType} found with ${measureType} production data (requested ${requestedCount})`);
            }

            selectionSet.clear();
            selectedIds.forEach(id => selectionSet.add(id));
            updateSelectedPlants(this.mapboxMap);
            updateSelectedPlantsWindow(selectionSet);
            updateGraph();
        } else {
            showToast(`No ${municipalitiesVisible ? 'municipalities' : 'plants'} found with ${measureType} production data`);
        }
    }

    changeFocus(value = 'default') {
        if (!this.initialized) {
            console.warn('FocusManager not yet initialized');
            return;
        }

        try {
            if (value === 'overview') {
                selectAll(this.mapboxMap);
                value = 'default';
            }

            const selectGroup = document.querySelector('.select-group');
            if (selectGroup) {
                selectGroup.style.display = (value === 'price' || value === 'production') ? 'flex' : 'none';
            }

            // Update year slider range based on focus
            const yearSlider = document.getElementById('year-slider');
            if (yearSlider) {
                if (value === 'price') {
                    yearSlider.min = '2019';
                    yearSlider.value = Math.max(2019, yearSlider.value);
                } else {
                    yearSlider.min = '2000';
                }
                // Update the year label to match any value changes
                const yearLabel = document.getElementById('year-label');
                if (yearLabel) {
                    yearLabel.textContent = yearSlider.value;
                }
            }

            const hasThreeOrMoreSelections = selectionSet.size >= 3;
            yearState.visible = hasThreeOrMoreSelections || value === 'price' || value === 'production';

            if (this.currentFocus) {
                this.currentFocus.remove();
            }

            const newFocus = this.focuses[value] || this.focuses.default;
            newFocus.apply();
            this.currentFocus = newFocus;
            focusState.changeFocus(value);
        } catch (error) {
            this.focuses.default.apply();
            this.currentFocus = this.focuses.default;
            focusState.changeFocus('default');
            yearState.visible = selectionSet.size >= 3;
        }
    }
}

export { FocusManager }; 