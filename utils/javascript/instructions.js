export function addInstructions() {
    const graphContainer = document.getElementById('graph-container');
    if (graphContainer) {
        graphContainer.innerHTML = `
            <div class="instructions">
                <h2 class="graph-title">Heating Plants of Denmark</h2>
                <p style="margin-bottom: 60px;">This tool enables exploring and analyzing heating plants across Denmark, providing insights into energy sources, supply areas, pricing, and availability.</p>
                <ul>
                    <li>
                        <img src="assets/icons/venstre.png" alt="venstre" width="16" height="16">
                        <span>You can move the divider by clicking and dragging.</span>
                    </li>
                    <li>
                        <img src="assets/icons/lasso.png" alt="Select Icon" width="16" height="16">
                        <span>Select plants to view details. Use Ctrl (⌘ on Mac) + click to deselect.</span>
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
                        <img src="assets/icons/no-connection.png" alt="Split Networks Icon" width="16" height="16">
                        <span>Split networks shows detailed local pricing but may not reflect full fuel mix in interconnected areas.</span>
                    </li>
                    <li style="display: flex; align-items: center;">
                        <img src="assets/icons/tutorial.png" alt="Tutorial Icon" width="16" height="16">
                        <span>Want a guided tour?</span>
                        <button class="tutorial-button" onclick="showTutorial()" style="margin-left: 10px;">
                            Tutorial
                            <img src="assets/icons/tutorial.png" class="tutorial-button-icon" alt="Tutorial Icon" width="16" height="16">
                        </button>
                    </li>
                </ul>
            </div>
        `;
    }
} 