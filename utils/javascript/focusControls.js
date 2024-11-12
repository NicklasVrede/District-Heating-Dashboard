export function changeFocus(value) {
    const measureContainer = document.getElementById('measure-container');
    
    // Show/hide measure dropdown based on production selection
    if (value === 'production') {
        measureContainer.style.display = 'flex';
    } else {
        measureContainer.style.display = 'none';
    }

    // Reset measure selector to first option when hiding
    if (value !== 'production') {
        document.getElementById('measure-selector').value = 'kul';
    }
} 