import { createOrUpdatePlotlyGraph } from '../../../graphs/components/multiPlant.js';
import { selectionSet } from '../../../main.js';
import { yearState } from './YearState.js';

export class DefaultFocus {
    constructor(map, measureContainer) {
        this.map = map;
        this.measureContainer = measureContainer;
    }

    apply() {
        console.log('DefaultFocus applying with focus: none');
        
        // Reset to default visualization state
        if (this.map) {
            this.map.setLayoutProperty('plants', 'visibility', 'visible');
            this.map.setLayoutProperty('plants-price', 'visibility', 'none');
        }
        
        // Hide measure container
        if (this.measureContainer) {
            this.measureContainer.classList.remove('visible');
            this.measureContainer.classList.add('hidden');
        }

        // Only hide year slider if less than 3 plants are selected
        const selectedForsyids = Array.from(selectionSet);
        yearState.visible = selectedForsyids.length >= 3;

        const data = window.dataDict;
        if (data && selectedForsyids.length > 0) {
            console.log('DefaultFocus: Calling createOrUpdatePlotlyGraph with none focus');
            createOrUpdatePlotlyGraph(data, selectedForsyids, 'none');
        }
    }

    remove() {
        //unused
    }
} 