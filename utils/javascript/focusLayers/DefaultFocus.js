import { updateGraph } from '../../../graphs/graphManager.js';
import { selectionSet } from '../../../main.js';
import { yearState } from './YearState.js';
import { municipalitiesVisible } from '../municipalitiesFunctions.js';

export class DefaultFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
    }

    apply() {
        console.log('DefaultFocus applying with focus: default');
        
        if (this.map) {
            if (!municipalitiesVisible) {
                this.map.setLayoutProperty('plants', 'visibility', 'visible');
            }
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        if (this.measureContainer) {
            this.measureContainer.classList.remove('visible');
            this.measureContainer.classList.add('hidden');
        }

        const selectedForsyids = Array.from(selectionSet);
        yearState.visible = selectedForsyids.length >= 3;

        const data = window.dataDict;
        if (data && selectedForsyids.length > 0) {
            console.log('DefaultFocus: Calling createOrUpdatePlotlyGraph with default focus');
            updateGraph();
        }
    }

    remove() {
        //unused
    }
} 