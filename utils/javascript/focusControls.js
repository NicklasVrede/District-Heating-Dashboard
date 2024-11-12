export function changeFocus(value) {
    const measureContainer = document.getElementById('measure-container');
    
    if (value === 'production') {
        measureContainer.classList.remove('hidden');
        measureContainer.classList.add('visible');
    } else {
        measureContainer.classList.remove('visible');
        measureContainer.classList.add('hidden');
        
        // Reset measure selector to first option when hiding
        document.getElementById('measure-selector').value = 'kul';
    }
}

// Make the function available globally
window.changeFocus = changeFocus; 