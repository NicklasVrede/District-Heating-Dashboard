import { getMapInstance } from './mapInstance.js';
import { selectionSet } from '../../main.js';

const OPENCAGE_API_KEY = 'e1337f0db4d14aeb8a69f6439fc005fc';

export function searchAddress() {
    const map = getMapInstance();
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    const address = document.getElementById('address').value;
    if (!address) {
        alert('Please enter an address.');
        return;
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&countrycode=dk&key=${OPENCAGE_API_KEY}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const result = data.results[0];
            if (result) {
                plotAddressOnMap(result.geometry, address);
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

    // Create popup first and then attach to marker
    const popup = new mapboxgl.Popup({ 
        offset: 25, 
        className: 'address-popup' 
    });

    marker
        .setPopup(popup)
        .togglePopup()
        .getElement().addEventListener('click', (e) => {
            if (e.ctrlKey) marker.remove();
        });

    checkIfWithinSupplyArea(coordinates, address, popup);
}

function checkIfWithinSupplyArea(coordinates, address, popup) {
    try {
        const pointGeoJSON = turf.point([coordinates.lng, coordinates.lat]);
        const areasSource = map.getSource('areas');
        
        if (!areasSource) throw new Error('Areas source not found.');

        const { forsyid, isWithinArea } = findContainingArea(pointGeoJSON, areasSource._data.features);
        const supplyPlant = isWithinArea ? findSupplyPlant(forsyid) : 'Unknown';

        // Update map highlights
        updateMapHighlights(forsyid, isWithinArea);
        
        // Update popup
        if (popup) {
            popup.setHTML(createPopupContent(address, supplyPlant));
        }
    } catch (error) {
        console.error('Error checking if within supply area:', error);
        alert('Error checking if within supply area.');
    }
}

// Helper functions
function findContainingArea(point, features) {
    for (const feature of features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            return {
                isWithinArea: true,
                forsyid: feature.properties.forsyid || null
            };
        }
    }
    return { isWithinArea: false, forsyid: null };
}

function findSupplyPlant(forsyid) {
    const plantsSource = map.getSource('plants');
    if (!plantsSource) return 'Unknown';

    const plant = plantsSource._data.features.find(
        feature => feature.properties.forsyid === forsyid
    );
    return plant?.properties.name || 'Unknown';
}

function updateMapHighlights(forsyid, isWithinArea) {
    const filterValue = isWithinArea ? forsyid : '';
    map.setFilter('highlighted-area', ['==', 'forsyid', filterValue]);
    map.setFilter('highlighted-plant', ['==', 'forsyid', filterValue]);
}

function createPopupContent(address, supplyPlant) {
    console.log('Popup content:', { address, supplyPlant });
    return `
        <div class="popup-content">
            <h4>${address}</h4>
            <p>Supply Plant: ${supplyPlant}</p>
            <p>Ctrl-click to remove this point.</p>
        </div>
    `;
}