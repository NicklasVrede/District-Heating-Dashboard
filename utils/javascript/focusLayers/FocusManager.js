import { getMapInstance } from '../mapInstance.js';
import { PriceFocus } from './PriceFocus.js';
import { ProductionFocus } from './ProductionFocus.js';
import { DefaultFocus } from './DefaultFocus.js';

class FocusManager {
    constructor() {
        this.measureContainer = document.getElementById('measure-container');
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        const map = getMapInstance();
        if (!map || !map.loaded()) {
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

    changeFocus(value) {
        if (!this.initialized) {
            console.warn('FocusManager not yet initialized');
            return;
        }

        try {
            this.focuses.none.apply();
            
            const focus = this.focuses[value];
            if (focus) {
                focus.apply();
            }
        } catch (error) {
            console.error('Error changing focus:', error);
        }
    }
}

const focusManager = new FocusManager();
window.changeFocus = (value) => focusManager.changeFocus(value);

export { FocusManager }; 