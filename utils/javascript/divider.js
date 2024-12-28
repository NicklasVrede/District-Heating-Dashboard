export function initDivider(map) {
    const divider = document.getElementById('divider');
    const mapDiv = document.getElementById('map');
    const graphDiv = document.getElementById('graph-container');
    
    let isDragging = false;
    let resizeRAF = null;

    // Add transition styles when not dragging
    function addTransitions() {
        mapDiv.style.transition = 'width 1s ease';
        graphDiv.style.transition = 'width 1s ease, left 1s ease';
        divider.style.transition = 'left 1s ease';
        
        // Continuously resize map during transition
        let startTime = performance.now();
        const duration = 1000;
        
        function animateResize(currentTime) {
            const elapsed = currentTime - startTime;
            if (elapsed < duration) {
                if (map) {
                    map.resize();
                }
                resizeRAF = requestAnimationFrame(animateResize);
            } else {
                if (map) {
                    map.resize();
                }
                resizeRAF = null;
            }
        }
        
        if (resizeRAF) {
            cancelAnimationFrame(resizeRAF);
        }
        resizeRAF = requestAnimationFrame(animateResize);
    }

    // Remove transitions while dragging
    function removeTransitions() {
        if (resizeRAF) {
            cancelAnimationFrame(resizeRAF);
            resizeRAF = null;
        }
        mapDiv.style.transition = 'none';
        graphDiv.style.transition = 'none';
        divider.style.transition = 'none';
    }

    // Set initial width based on screen size
    function setInitialWidth() {
        if (window.innerWidth >= 1200) {
            const graphWidth = 700;
            const percentage = ((window.innerWidth - graphWidth) / window.innerWidth) * 100;
            
            addTransitions(); // Add transitions for smooth initial setup
            
            mapDiv.style.width = percentage + '%';
            graphDiv.style.width = (100 - percentage) + '%';
            graphDiv.style.left = percentage + '%';
            divider.style.left = percentage + '%';
        } else {
            // Set default widths for smaller screens (50-50 split)
            mapDiv.style.width = '50%';
            graphDiv.style.width = '50%';
            graphDiv.style.left = '50%';
            divider.style.left = '50%';
        }
    }
    
    // Set initial width on load
    setInitialWidth();
    
    // Update on window resize
    window.addEventListener('resize', setInitialWidth);
        
    // Mouse events
    divider.addEventListener('mousedown', startResize);
    
    // Touch events
    divider.addEventListener('touchstart', startResize);
    
    function startResize(e) {
        isDragging = true;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        if (e.type === 'mousedown') {
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        } else if (e.type === 'touchstart') {
            document.addEventListener('touchmove', resize);
            document.addEventListener('touchend', stopResize);
        }
        
        removeTransitions();
    }
    
    let resizeTimeout;
    function resize(e) {
        const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const windowWidth = document.documentElement.clientWidth;
        const percentage = (x / windowWidth) * 100;
        
        // Use a fixed percentage minimum regardless of screen size
        const minGraphPercentage = 20;  // Always allow graph to be as small as 20% of screen width
        
        if (percentage > 20 && percentage < (100 - minGraphPercentage)) {
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
        isDragging = false;
        
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
        
        if (resizeTimeout) {
            cancelAnimationFrame(resizeTimeout);
        }
        
        if (map) {
            map.resize();
        }
        
        addTransitions();
    }
}