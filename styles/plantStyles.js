export const plantStyles = {
    id: 'plants',
    type: 'symbol',
    source: 'plants',
    layout: {
        'icon-image': [
            'case',
            ['all',
                ['has', 'fv_net'],
                ['!=', ['get', 'fv_net'], ''],
                ['!=', ['get', 'fv_net'], null],
                ['!=', ['get', 'fv_net'], '0'],
                ['!=', ['get', 'fv_net'], '999999'],
                ['any',
                    ['==', ['get', 'fv_net'], '2'],
                    ['==', ['get', 'fv_net'], '17'],
                    ['==', ['get', 'fv_net'], '18'],
                    ['==', ['get', 'fv_net'], '79'],
                    ['==', ['get', 'fv_net'], '81'],
                    ['==', ['get', 'fv_net'], '126'],
                    ['==', ['get', 'fv_net'], '163'],
                    ['==', ['get', 'fv_net'], '206'],
                    ['==', ['get', 'fv_net'], '231'],
                    ['==', ['get', 'fv_net'], '327'],
                    ['==', ['get', 'fv_net'], '204'],
                    ['==', ['get', 'fv_net'], '298'],
                    ['==', ['get', 'fv_net'], '172']
                ]
            ],
            'square',  // Plants that are part of a network with multiple plants
            'circle'   // Plants that are alone or not in a network
        ],
        'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 0.5,    // Smaller at min zoom
            10, 0.9,   // Medium at mid zoom
            15, 1.4    // Larger at max zoom
        ],
        'icon-allow-overlap': true
    },
    paint: {
        'icon-opacity': 0.8
    }
};