export const highlightStyles = {
    // Highlight styles (make more prominent)
    areaFillColor: '#FF0000',
    areaDefaultFillColor: '#888888',
    areaBorderColor: '#FF0000',
    areaDefaultBorderColor: '#0000ff',
    plantStrokeWidth: 3,
    plantStrokeColor: '#FF0000',
    plantBlur: 0,
    plantOpacity: 1,
    plantDefaultStrokeWidth: 0,
    plantDefaultBlur: 0,
    plantDefaultOpacity: 1,

    // Selection styles
    selectedPlant: {
        radius: 7,
        color: 'rgba(0, 0, 0, 0)',
        strokeWidth: 2,
        strokeColor: '#FF0000',
        strokeOpacity: 1
    },
    selectedAreaFillColor: '#FF0000',
    selectedAreaOpacity: 0.2,
    selectedMunicipalitiesFill: {
        id: 'highlighted-municipalities-fill',
        type: 'fill',
        source: 'municipalities',
        layout: {},
        paint: {
            'fill-color': '#0000cc',
            'fill-opacity': 0.7
        }
    }
};