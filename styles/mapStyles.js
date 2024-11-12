export const plantCircleLayer = {
    'id': 'plants',
    'type': 'circle',
    'source': 'plants',
    'paint': {
        'circle-radius': [
            'case',
            ['has', 'size'], ['get', 'size'],
            5  // default size
        ],
        'circle-color': [
            'case',
            ['has', 'color'], ['get', 'color'],
            '#000000'  // default color
        ],
        'circle-opacity': 0.8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
    }
}; 