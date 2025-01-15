let loadingCounter = 0;
const totalLoadingTasks = 5;
const loadingSpinner = document.getElementById('loading-spinner');
const mapOverlay = document.getElementById('map-overlay');

// Create and append progress bar elements
const progressBar = document.createElement('div');
const progressBarContainer = document.createElement('div');
const loadingText = document.createElement('div');
loadingText.className = 'loading-text';
progressBarContainer.className = 'progress-bar-container';
progressBar.className = 'progress-bar';

if (loadingSpinner) {
    loadingSpinner.appendChild(loadingText);
    progressBarContainer.appendChild(progressBar);
    loadingSpinner.appendChild(progressBarContainer);
}

const loadingMessages = {
    0: 'Loading data dictionary...',
    1: 'Loading plants...',
    2: 'Loading areas...',
    3: 'Loading gas areas...',
    4: 'Loading municipalities...',
    5: 'Initializing map...'
};

export function updateLoadingState(increment = true, message) {
    if (increment) {
        loadingCounter++;
    } else {
        loadingCounter--;
    }
    
    // Update progress bar
    let progress = (loadingCounter / totalLoadingTasks) * 100;
    
    // Force progress to 100% when all tasks are complete
    if (loadingCounter === 0) {
        progress = 100;
    }
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Update loading text
    if (loadingText) {
        loadingText.textContent = message || loadingMessages[loadingCounter] || 'Loading...';
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
            // Wait for progress bar to reach 100% before starting fade out
            setTimeout(() => {
                loadingSpinner.classList.add('fade-out');
                mapOverlay.classList.remove('active');
                mapOverlay.classList.add('fade-out');
                
                // Wait for fade out animation to complete before hiding
                setTimeout(() => {
                    loadingSpinner.style.display = 'none';
                    mapOverlay.style.display = 'none';
                    mapOverlay.classList.remove('fade-out');
                }, 300);
            }, 300); // Wait for progress bar to complete
        }
    }
}

export { totalLoadingTasks }; 