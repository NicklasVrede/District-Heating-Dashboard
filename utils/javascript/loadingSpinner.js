let loadingCounter = 0;
const totalLoadingTasks = 5;
const loadingSpinner = document.getElementById('loading-spinner');
const mapOverlay = document.getElementById('map-overlay');

// Create and append progress bar elements
const progressBar = document.createElement('div');
const progressBarContainer = document.createElement('div');
progressBarContainer.className = 'progress-bar-container';
progressBar.className = 'progress-bar';
if (loadingSpinner) {
    progressBarContainer.appendChild(progressBar);
    loadingSpinner.appendChild(progressBarContainer);
}

export function updateLoadingState(increment = true) {
    if (increment) {
        loadingCounter++;
    } else {
        loadingCounter--;
    }
    
    // Update progress bar
    const progress = ((totalLoadingTasks - loadingCounter) / totalLoadingTasks) * 100;
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (loadingSpinner && mapOverlay) {
        if (loadingCounter > 0) {
            loadingSpinner.classList.remove('fade-out');
            loadingSpinner.style.display = 'flex';
            mapOverlay.style.display = 'block';
            setTimeout(() => {
                mapOverlay.classList.add('active');
            }, 10);
        } else {
            loadingSpinner.classList.add('fade-out');
            mapOverlay.classList.remove('active');
            mapOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingSpinner.style.display = 'none';
                mapOverlay.style.display = 'none';
                mapOverlay.classList.remove('fade-out');
            }, 300);
        }
    }
}

export { totalLoadingTasks }; 