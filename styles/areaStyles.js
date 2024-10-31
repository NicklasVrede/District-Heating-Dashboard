// areaStyles.js

// Define the area styles directly
export const areaStyles = {
    fill: {
        id: 'areas',
        type: 'fill',
        source: 'areas',
        layout: {},
        paint: {
            'fill-color': '#9b94ff', // Custom fill color (red)
            'fill-opacity': 0.2 // Custom fill opacity
        }
    },
    line: {
        id: 'areas-border',
        type: 'line',
        source: 'areas',
        layout: {},
        paint: {
            'line-color': '#0000ff', // Custom line color (blue)
            'line-width': 1, // Custom line width
            'line-opacity': 0.5 // Custom line opacity
        }
    }
};