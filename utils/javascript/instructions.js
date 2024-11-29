export function addInstructions() {
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
        graphContainer.innerHTML = `
            <div class="instructions">
                <h2 class="graph-title">Heating Plants of Denmark</h2>
                <ul>
                    <li>
                        <span>&larr; You can move the divider by clicking and dragging.</span>
                    </li>
                    <li>
                        <img src="assets/icons/lasso.png" alt="Select Icon" width="16" height="16">
                        <span>Select plants to view details. Use Ctrl + click to deselect.</span>
                    </li>
                    <li>
                        <img src="assets/icons/mapfocus.png" alt="Map Focus Icon" width="16" height="16">
                        <span>Adjust the map focus to gain additional information on the map.</span>
                    </li>
                    <li>
                        <img src="assets/icons/municipalities.png" alt="Municipalities Icon" width="16" height="16">
                        <span>Enable municipalities to access data by region.</span>
                    </li>
                    <li>
                        <img src="assets/icons/check.png" alt="check box" width="16" height="16">
                        <span>Toggle gas supply areas on the map.</span>
                    </li>
                    <li>
                        <img src="assets/icons/tutorial.png" alt="Tutorial Icon" width="16" height="16">
                        <span>Want a guided tour? <button class="tutorial-button" onclick="showTutorial()">Start Tutorial</button></span>
                    </li>
                </ul>
            </div>
        `;
    }
} 