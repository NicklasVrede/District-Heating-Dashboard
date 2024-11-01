import { map } from '../../main.js'; // Assuming map is exported from main.js

const OPENCAGE_API_KEY = 'e1337f0db4d14aeb8a69f6439fc005fc'; // Replace with your OpenCage API key

export function searchAddress() {
    const address = document.getElementById('address').value;
    if (!address) {
        alert('Please enter an address.');
        return;
    }

    console.log('Map sources in addressLookup.js:', map.getStyle().sources);

    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.results.length > 0) {
                const result = data.results[0];
                const coordinates = result.geometry;
                plotAddressOnMap(coordinates, address);
            } else {
                alert('Address not found.');
            }
        })
        .catch(error => {
            console.error('Error fetching address:', error);
            alert('Error fetching address.');
        });
}

function plotAddressOnMap(coordinates, address) {
    const marker = new mapboxgl.Marker()
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);

    map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 12,
        speed: 1.2,
        curve: 1.42,
        easing: (t) => t
    });

    // Create an empty popup and attach it to the marker
    const popup = new mapboxgl.Popup({ offset: 25, className: 'address-popup' })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);

    marker.setPopup(popup);

    // Add event listener for Ctrl-click to remove the marker
    marker.getElement().addEventListener('click', (e) => {
        if (e.ctrlKey) {
            marker.remove();
        }
    });

    // Update the popup content after checking the supply plant
    checkIfWithinSupplyArea(coordinates, address, popup);
}

function checkIfWithinSupplyArea(coordinates, address, popup) {
    console.log('Checking if within supply area:', coordinates); // Debugging statement

    try {
        // Convert point to a GeoJSON point
        const pointGeoJSON = turf.point([coordinates.lng, coordinates.lat]);

        // Get features from the 'areas' source
        const areasSource = map.getSource('areas');
        if (!areasSource) {
            throw new Error('Areas source not found.');
        }

        const areasFeatures = areasSource._data.features; // Access the GeoJSON features

        // Check if point is within any area
        let isWithinArea = false;
        let forsyid = null;

        for (const feature of areasFeatures) {
            const polygon = feature; // GeoJSON of the polygon

            // Check if the point is within the current polygon
            if (turf.booleanPointInPolygon(pointGeoJSON, polygon)) {
                isWithinArea = true;
                forsyid = feature.properties.forsyid || null; // Assuming forsyid is in properties
                break;
            }
        }

        let supplyPlant = 'Unknown';
        if (isWithinArea && forsyid) {
            // Fetch the plant name using forsyid
            const plantsSource = map.getSource('plants');
            if (plantsSource) {
                const plantsFeatures = plantsSource._data.features; // Access the GeoJSON features
                for (const plantFeature of plantsFeatures) {
                    if (plantFeature.properties.forsyid === forsyid) {
                        supplyPlant = plantFeature.properties.name || 'Unknown'; // Assuming plant name is in properties
                        break;
                    }
                }
            }

            // Highlight the supply area
            map.setFilter('highlighted-area', ['==', 'forsyid', forsyid]);

            // Highlight the supply plant
            map.setFilter('highlighted-plant', ['==', 'forsyid', forsyid]);
        } else {
            // Clear the highlights if no area is found
            map.setFilter('highlighted-area', ['==', 'forsyid', '']);
            map.setFilter('highlighted-plant', ['==', 'forsyid', '']);
        }

        // Update the popup with the supply plant information and instructions
        if (popup) {
            popup.setHTML(`<div class="popup-content"><h4>${address}</h4><p>Supply Plant: ${supplyPlant}</p><p>Ctrl-click to remove this point.</p></div>`);
        } else {
            console.error('Popup is undefined.');
        }
    } catch (error) {
        console.error('Error checking if within supply area:', error);
        alert('Error checking if within supply area.');
    }
}