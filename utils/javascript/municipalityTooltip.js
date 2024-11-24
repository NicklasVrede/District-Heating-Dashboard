export function createMunicipalityTooltip(map) {
    const tooltip = document.createElement('div');
    tooltip.className = 'mapboxgl-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '9999';
    document.body.appendChild(tooltip);

    let hoveredMunicipalityId = null;

    map.on('mousemove', 'municipalities-fill', (e) => {
        if (e.features.length > 0) {
            const feature = e.features[0];
            const municipalityId = feature.properties.lau_1;

            if (hoveredMunicipalityId !== municipalityId) {
                tooltip.innerHTML = `
                    <strong>${feature.properties.label_dk}</strong><br>
                    Inhabitants: <span id="inhabitants-placeholder">Placeholder</span><br>
                    Energy Production: <span id="energy-production-placeholder">Placeholder</span>
                `;
                hoveredMunicipalityId = municipalityId;
            }

            tooltip.style.display = 'block';
            tooltip.style.left = `${e.point.x + 10}px`;
            tooltip.style.top = `${e.point.y + 10}px`;
        }
    });

    map.on('mouseleave', 'municipalities-fill', () => {
        hoveredMunicipalityId = null;
        tooltip.style.display = 'none';
    });
} 