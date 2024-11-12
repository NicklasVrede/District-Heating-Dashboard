export const plantStyles = {
    id: 'plants',
    type: 'circle',
    source: 'plants',
    paint: {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
        // Set different radius for different zoom levels
        // Zoom level, radius
            5, 4,
            10, 8,
            15, 12,
            20, 16 
        ],
        'circle-color': '#4d4c4c',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white',
        'circle-opacity': 0.7
    }
};