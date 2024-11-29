import { addInstructions } from './instructions.js';

export function clearGraph() {
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
        graphContainer.innerHTML = '';
        addInstructions();
    }
} 