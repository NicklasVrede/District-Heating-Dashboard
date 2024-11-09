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

export function applyFilters() {
    const focus = document.getElementById('focus-selector').value;
    const measure = document.getElementById('measure-selector').value;
    const filter = document.getElementById('entity-filter').value;

    // Here you can implement the logic to apply all filters at once
    console.log('Applying filters:', { focus, measure, filter });
    
    // Call your existing filter logic here
} 