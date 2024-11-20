export function createMunicipalityTooltip(map) {
    // Create a tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'mapboxgl-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    tooltip.style.display = 'none'; // Initially hidden
    document.body.appendChild(tooltip);

    // Event listener for mouse move
    map.on('mousemove', 'municipalities-fill', (e) => {
        if (e.features.length > 0) {
            const feature = e.features[0];
            const { label_dk } = feature.properties;

            // Set tooltip content
            tooltip.innerHTML = `
                <strong>${label_dk}</strong><br>
                Inhabitants: <span id="inhabitants-placeholder">N/A</span><br>
                Energy Production: <span id="energy-production-placeholder">N/A</span>
            `;

            // Position the tooltip
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.originalEvent.clientX + 10}px`;
            tooltip.style.top = `${e.originalEvent.clientY + 10}px`;
        }
    });

    // Hide tooltip on mouse leave
    map.on('mouseleave', 'municipalities-fill', () => {
        tooltip.style.display = 'none';
    });
} 