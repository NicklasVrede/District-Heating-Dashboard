// areaStyles.js

// Define the area styles directly
export const areaStyles = {
    fill: {
        id: 'areas',
        type: 'fill',
        source: 'areas',
        layout: {},
        paint: {
            'fill-color': '#0000ff',
            'fill-opacity': 0.1
        }
    },
    line: {
        id: 'areas-border',
        type: 'line',
        source: 'areas',
        layout: {},
        paint: {
            'line-color': '#0000ff',
            'line-width': 0.6,
            'line-opacity': 0.1
        }
    },
    municipalitiesFill: {
        id: 'municipalities-fill',
        type: 'fill',
        source: 'municipalities',
        layout: {},
        paint: {
            'fill-color': '#FFFFFF',
            'fill-opacity': 0
        }
    },
    municipalitiesLine: {
        id: 'municipalities-line',
        type: 'line',
        source: 'municipalities',
        layout: {},
        paint: {
            'line-color': '#000000',
            'line-width': 0.2
        }
    },
    highlightedMunicipalitiesFill: {
        id: 'highlighted-municipalities-fill',
        type: 'fill',
        source: 'municipalities',
        layout: {},
        paint: {
            'fill-color': '#FF0000',
            'fill-opacity': 0.7
        }
    }
};

export const gasAreaStyles = {
    fill: {
        id: 'gas-areas-fill',
        type: 'fill',
        source: 'gas-areas',
        paint: {
            'fill-color': '#fcef38',
            'fill-opacity': 0.7
        }
    },
    line: {
        id: 'gas-areas-line',
        type: 'line',
        source: 'gas-areas',
        paint: {
            'line-color': '#6e6b17',
            'line-width': 0.7
        }
    }
};