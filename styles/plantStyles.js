export const plantStyles = {
    id: 'plants',
    type: 'circle',
    source: 'plants',
    paint: {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 4,    // At zoom level 5, radius is 4
            10, 8,   // At zoom level 10, radius is 8
            15, 12,  // At zoom level 15, radius is 12
            20, 16   // At zoom level 20, radius is 16
        ],
        'circle-color': 'rgb(38, 0, 255)',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
    }
};