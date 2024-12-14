export function initDivider(map) {
    const divider = document.getElementById('divider');
    const mapDiv = document.getElementById('map');
    const graphDiv = document.getElementById('graph-container');
    
    // Mouse events
    divider.addEventListener('mousedown', startResize);
    
    // Touch events
    divider.addEventListener('touchstart', startResize);
    
    function startResize(e) {
        e.preventDefault();
        
        // Add appropriate event listeners based on event type
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        } else if (e.type === 'touchstart') {
            document.addEventListener('touchmove', resize);
            document.addEventListener('touchend', stopResize);
        }
    }
    
    function resize(e) {
        // Get the correct x position whether it's mouse or touch
        const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const windowWidth = document.documentElement.clientWidth;
        const percentage = (x / windowWidth) * 100;
        
        if (percentage > 20 && percentage < 80) {
            requestAnimationFrame(() => {
                mapDiv.style.width = percentage + '%';
                graphDiv.style.width = (100 - percentage) + '%';
                graphDiv.style.left = percentage + '%';
                divider.style.left = percentage + '%';
                
                if (map) {
                    map.resize();
                }
                
                // More aggressive Plotly resize
                const graphs = document.querySelectorAll('.js-plotly-plot');
                graphs.forEach(graph => {
                    if (graph) {
                        Plotly.relayout(graph, {
                            width: graphDiv.clientWidth * 0.95,  // 95% of container width
                            'xaxis.autorange': true,
                            'yaxis.autorange': true
                        });
                    }
                });
            });
        }
    }
    
    function stopResize(e) {
        // Remove both mouse and touch event listeners
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
        
        // Final resize for both map and graphs
        setTimeout(() => {
            if (map) {
                map.resize();
            }
            const graphs = document.querySelectorAll('.js-plotly-plot');
            graphs.forEach(graph => {
                if (graph) {
                    Plotly.relayout(graph, {
                        width: graphDiv.clientWidth * 0.95,
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
            });
        }, 100);
    }
}