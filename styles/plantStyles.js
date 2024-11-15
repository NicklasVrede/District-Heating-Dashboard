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
            5, 2,
            10, 8,
            15, 12,
            20, 16 
        ],
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#808080',
        'circle-opacity': 1
    }
};