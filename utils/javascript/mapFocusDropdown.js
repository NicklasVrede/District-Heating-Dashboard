import { changeFocus } from '../../main.js';

export function initMapFocusDropdown() {
    const button = document.querySelector('.map-focus-button');
    const dropdown = document.createElement('div');
    dropdown.className = 'map-focus-dropdown';
     
    const options = [
        { value: 'none', label: 'None' },
        { value: 'overview', label: 'Overview' },
        { value: 'price', label: 'Price (MWh)' },
        { value: 'production', label: 'Production' }
    ];
    
    function hideDropdown() {
        dropdown.classList.remove('show');
    }
    
    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'map-focus-option';
        div.textContent = option.label;
        div.dataset.value = option.value;
        
        div.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            changeFocus(option.value);
            // Update button text - show "Map Focus" for none, otherwise show option label
            button.querySelector('span').textContent = option.value === 'none' ? 'Map Focus' : option.label;
            // Update active state
            dropdown.querySelectorAll('.map-focus-option').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.value === option.value);
            });
            hideDropdown(); // Hide dropdown after selection
        });
        
        dropdown.appendChild(div);
    });
    
    // Append dropdown to the button
    button.appendChild(dropdown);

    // Toggle dropdown when button is clicked
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', hideDropdown);
} 