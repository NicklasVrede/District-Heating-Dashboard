// utils/javascript/toggleGasAreas.js
let gasAreasVisible = false;

export function toggleGasAreas(map) {
    if (!map) {
        console.error('Map instance is not available.');
        return;
    }

    const checkbox = document.getElementById('toggle-gas-areas');
    const toggleButton = document.querySelector('.map-toggle-frame'); // Select the toggle button
    gasAreasVisible = checkbox.checked;

    if (gasAreasVisible) {
        // Show gas areas
        map.setLayoutProperty('gas-areas-fill', 'visibility', 'visible');
        map.setLayoutProperty('gas-areas-line', 'visibility', 'visible');
        toggleButton.classList.add('toggle-active');
    } else {
        // Hide gas areas
        map.setLayoutProperty('gas-areas-fill', 'visibility', 'none');
        map.setLayoutProperty('gas-areas-line', 'visibility', 'none');
        toggleButton.classList.remove('toggle-active');
    }
}