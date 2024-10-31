const apiKey = 'e1337f0db4d14aeb8a69f6439fc005fc'; // Replace with your OpenCage API key

// Function to fetch address suggestions
function autocompleteAddress() {
    const input = document.getElementById('address');
    const list = document.getElementById('autocomplete-list');
    const query = input.value;

    if (!query) {
        list.innerHTML = '';
        return;
    }

    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5&countrycode=dk`)
        .then(response => response.json())
        .then(data => {
            console.log('Autocomplete API response:', data); // Debugging statement
            list.innerHTML = '';
            if (data.status.code === 402) {
                showToast('Address API is dead 😢', 'error');
                return;
            }
            data.results.forEach(result => {
                const item = document.createElement('div');
                item.innerText = result.formatted;
                item.addEventListener('click', () => {
                    input.value = result.formatted;
                    list.innerHTML = '';
                });
                list.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error fetching address suggestions:', error);
            showToast('Error fetching address suggestions. Please try again later.', 'error');
        });
}

// Function to geocode address and show coordinates
function searchAddress() {
    const address = document.getElementById('address').value;
    geocodeAddress(address)
        .then(coordinates => {
            console.log('Coordinates:', coordinates);
            // Add your logic to plot coordinates on the map and zoom to the location
        })
        .catch(error => {
            console.error('Error geocoding address:', error);
            showToast(error.message, 'error');
        });
}

// Function to geocode address using OpenCage API
function geocodeAddress(address) {
    return fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            console.log('Geocode API response:', data); // Debugging statement
            if (data.status.code === 402) {
                showToast('Address API is dead 😢', 'error');
            }
            if (data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                return { latitude: lat, longitude: lng };
            } else {
                throw new Error(`No results found for address: ${address}`);
            }
        })
        .catch(error => {
            console.error('Error geocoding address:', error);
            throw error;
        });
}

// Function to show toast notifications
function showToast(message, type) {
    console.log('Showing toast:', message, type); // Debugging statement
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toastContainer.appendChild(toast);

    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Ensure the toast container exists
document.addEventListener('DOMContentLoaded', () => {
    console.log('Adding toast container'); // Debugging statement
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
});