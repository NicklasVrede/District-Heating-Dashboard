export function initialiseBaseMap() {
    // Set your Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2FzdnJlZGUyMyIsImEiOiJjbTJ0Mm1kdDgwMzZ0MnFzYWFyZ3pveWJ1In0.V9qwBfsH4plxE_fz89kuYg'; // Replace with your Mapbox access token

    // Initialize the map and set its view to a specific location and zoom level
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [10.0, 56.0], // starting position [lng, lat] (centered on Denmark)
        zoom: 5 // starting zoom
    });

    // Enable scroll zoom
    map.scrollZoom.enable();

    // Set zoom around the mouse location
    map.scrollZoom.setWheelZoomRate(1); // Adjust the zoom rate if needed

    // Example of adding a marker
    const marker = new mapboxgl.Marker()
        .setLngLat([10.0, 56.0]) // Coordinates for the marker (centered on Denmark)
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Denmark</h3><p>Center of Denmark.</p>')) // Popup content
        .addTo(map);
}