import { getMapInstance } from '../mapInstance.js';
import { PriceFocus } from './PriceFocus.js';
import { ProductionFocus } from './ProductionFocus.js';
import { DefaultFocus } from './DefaultFocus.js';
import { focusState } from './FocusState.js';

class FocusManager {
    constructor() {
        this.measureContainer = document.getElementById('measure-container');
        this.initialized = false;
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
    }

    changeFocus(value = 'none') {
        if (!this.initialized) {
            console.warn('FocusManager not yet initialized');
            return;
        }

        console.log('FocusManager changing focus to:', value);

        try {
            const focus = this.focuses[value] || this.focuses.none;
            focus.apply();
        } catch (error) {
            console.error('Error changing focus:', error);
            this.focuses.none.apply();
            focusState.focus = 'none';
        }
    }
}

export { FocusManager }; 