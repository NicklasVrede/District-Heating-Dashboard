const selectedPlants = [];

export function addPlantToSelection(plant) {
    selectedPlants.push(plant);
    updatePlantDisplay();
}

export function removePlantFromSelection(plant) {
    const index = selectedPlants.findIndex(p => p.name === plant.name);
    if (index > -1) {
        selectedPlants.splice(index, 1);
    }
    updatePlantDisplay();
}

export function updatePlantDisplay() {
    const display = document.getElementById('plant-display');
    display.innerHTML = ''; // Clear previous content

    selectedPlants.forEach(plant => {
        const plantDiv = document.createElement('div');
        plantDiv.className = 'plant-metrics';
        plantDiv.id = `plant-${plant.name.replace(/\s+/g, '-')}`; // Add an ID to the plant div
        plantDiv.innerHTML = `
            <h3>${plant.name}</h3>
            <p>Address: ${plant.address}</p>
            <p>Latitude: ${plant.latitude}</p>
            <p>Longitude: ${plant.longitude}</p>
            <p>Metric 1: ${plant.metric1}</p>
            <p>Metric 2: ${plant.metric2}</p>
            <p>Area Reference: ${plant.areaReference ? plant.areaReference : 'N/A'}</p>
        `;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removePlantFromSelection(plant));
        plantDiv.appendChild(removeButton);
        display.appendChild(plantDiv);
    });
}