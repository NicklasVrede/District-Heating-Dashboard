import { getMapInstance } from '../mapInstance.js';
import { PriceFocus } from './PriceFocus.js';
import { ProductionFocus } from './ProductionFocus.js';
import { DefaultFocus } from './DefaultFocus.js';
import { focusState } from './FocusState.js';
import { selectAll } from '../selectionFunctions.js';

class FocusManager {
    constructor() {
        this.measureContainer = document.getElementById('measure-container');
        this.initialized = false;
        this.currentFocus = null;
        this.initialize();
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