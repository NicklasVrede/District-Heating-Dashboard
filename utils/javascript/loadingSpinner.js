let loadingCounter = 0;
const totalLoadingTasks = 4;
const loadingSpinner = document.getElementById('loading-spinner');
const mapOverlay = document.querySelector('.map-overlay');

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

// Animation related variables
let targetProgress = 0;
let currentDisplayProgress = 0;
let animationFrameId = null;
let currentMessage = 'Loading...';
let messageQueue = [];
let messageUpdateTimeoutId = null;

const loadingMessages = {
    0: 'Loading data dictionary...',
    1: 'Loading map layers...',
    2: 'Initializing map sources...',
    3: 'Setting up fuel manager...',
    4: 'Finalizing...'
};

function showOverlay() {
    if (mapOverlay) {
        mapOverlay.style.display = 'block';
        // Use setTimeout to ensure the display: block has taken effect
        setTimeout(() => {
            mapOverlay.classList.add('active');
        }, 10);
    }
}

function hideOverlay() {
    if (mapOverlay) {
        mapOverlay.classList.remove('active');
        mapOverlay.classList.add('fade-out');
        setTimeout(() => {
            mapOverlay.style.display = 'none';
            mapOverlay.classList.remove('fade-out');
        }, 700); // Match the CSS transition time
    }
}

// Animate progress bar smoothly
function animateProgressBar() {
    if (Math.abs(targetProgress - currentDisplayProgress) < 0.1) {
        currentDisplayProgress = targetProgress;
        if (progressBar) {
            progressBar.style.width = `${currentDisplayProgress}%`;
        }
        animationFrameId = null;
        return;
    }
    
    // Smooth animation with easing
    currentDisplayProgress += (targetProgress - currentDisplayProgress) * 0.1;
    
    if (progressBar) {
        progressBar.style.width = `${currentDisplayProgress}%`;
    }
    
    animationFrameId = requestAnimationFrame(animateProgressBar);
}

// Update loading message with smooth transition
function updateLoadingMessage(message) {
    if (!message || message === currentMessage) return;
    
    // Add message to queue if it's not already the current message
    if (!messageQueue.includes(message)) {
        messageQueue.push(message);
    }
    
    // If we're not already processing messages, start
    if (!messageUpdateTimeoutId) {
        processNextMessage();
    }
}

function processNextMessage() {
    if (messageQueue.length === 0) {
        messageUpdateTimeoutId = null;
        return;
    }
    
    const nextMessage = messageQueue.shift();
    
    // Fade out current text
    if (loadingText) {
        loadingText.style.opacity = '0';
        
        // After fade out, update text and fade in
        setTimeout(() => {
            loadingText.textContent = nextMessage;
            currentMessage = nextMessage;
            loadingText.style.opacity = '1';
            
            // Schedule next message processing
            messageUpdateTimeoutId = setTimeout(processNextMessage, 300);
        }, 200);
    } else {
        messageUpdateTimeoutId = setTimeout(processNextMessage, 100);
    }
}

export function updateLoadingState(increment = true, message) {
    if (increment) {
        loadingCounter++;
        showOverlay();
        
        // Calculate target progress based on proportion of total tasks
        targetProgress = Math.min((loadingCounter / totalLoadingTasks) * 100, 100);
        
        // For increments, also add a bit of random progress to make it look more natural
        if (targetProgress < 95) {
            targetProgress += Math.random() * 5;
        }
        
        // Start progress bar animation if not already running
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animateProgressBar);
        }
        
        // Update message if provided
        if (message) {
            updateLoadingMessage(message);
        }
    } else {
        loadingCounter--;
        
        // Ensure progress increases even when tasks complete out of order
        const newProgress = Math.max(targetProgress, ((totalLoadingTasks - loadingCounter) / totalLoadingTasks) * 100);
        targetProgress = Math.min(newProgress, 100);
        
        // When all tasks are complete, ensure we reach 100%
        if (loadingCounter === 0) {
            targetProgress = 100;
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animateProgressBar);
            }
        }
    }
    
    if (loadingSpinner) {
        if (loadingCounter > 0) {
            loadingSpinner.classList.remove('fade-out');
            loadingSpinner.style.display = 'flex';
        } else {
            // Wait for progress bar to reach 100% before starting fade out
            setTimeout(() => {
                // Cancel any pending animations and message updates
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                if (messageUpdateTimeoutId) {
                    clearTimeout(messageUpdateTimeoutId);
                    messageUpdateTimeoutId = null;
                }
                
                loadingSpinner.classList.add('fade-out');
                hideOverlay();
                
                // Wait for fade out animation to complete before hiding
                setTimeout(() => {
                    loadingSpinner.style.display = 'none';
                    // Reset variables for next time
                    currentDisplayProgress = 0;
                    targetProgress = 0;
                    currentMessage = 'Loading...';
                    messageQueue = [];
                }, 300);
            }, 300);
        }
    }
}

export { totalLoadingTasks }; 