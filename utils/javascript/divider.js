export function initDivider(map) {
    const divider = document.getElementById('divider');
    const mapDiv = document.getElementById('map');
    const graphDiv = document.getElementById('graph-container');
    
    // Mouse events
    divider.addEventListener('mousedown', startResize);
    
    // Touch events
    divider.addEventListener('touchstart', startResize);
    
    function startResize(e) {
        // Only prevent default if the event is cancelable
        if (e.cancelable) {
            e.preventDefault();
        }
        
        // Add appropriate event listeners based on event type
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        } else if (e.type === 'touchstart') {
            document.addEventListener('touchmove', resize);
            document.addEventListener('touchend', stopResize);
        }
    }
    
    let resizeTimeout;
    function resize(e) {
        // Get the correct x position whether it's mouse or touch
        const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const windowWidth = document.documentElement.clientWidth;
        const percentage = (x / windowWidth) * 100;
        
        if (percentage > 20 && percentage < 80) {
            // Update DOM immediately
            mapDiv.style.width = percentage + '%';
            graphDiv.style.width = (100 - percentage) + '%';
            graphDiv.style.left = percentage + '%';
            divider.style.left = percentage + '%';
            
            // Debounce expensive map resize
            if (resizeTimeout) {
                cancelAnimationFrame(resizeTimeout);
            }
            resizeTimeout = requestAnimationFrame(() => {
                if (map) {
                    map.resize();
                }
            });
        }
    }
    
    function stopResize() {
        // Remove both mouse and touch event listeners
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
        
        // Cancel any pending resize
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        
        // Final map resize
        if (map) {
            map.resize();
        }
    }
}