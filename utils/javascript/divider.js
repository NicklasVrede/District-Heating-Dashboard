export function initDivider(map) {
    const divider = document.getElementById('divider');
    const mapDiv = document.getElementById('map');
    const graphDiv = document.getElementById('graph-container');
    
    divider.addEventListener('mousedown', function(e) {
        e.preventDefault();
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });
    
    function resize(e) {
        const x = e.clientX;
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
    
    function stopResize() {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        
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