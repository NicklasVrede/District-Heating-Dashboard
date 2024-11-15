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
            'line-width': 1,
            'line-opacity': 0.1
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