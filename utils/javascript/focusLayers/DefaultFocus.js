import { selectionSet } from '../../../main.js';
import { yearState } from './YearState.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';

export class DefaultFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
    }

    apply() {
        // No specific actions needed for default focus
    }

    remove() {
        // Unused, removal is handled elsewhere
    }
}