function showTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'flex';
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'none';

    // Stop the video by resetting the src
    const iframe = modal.querySelector('iframe');
    const src = iframe.src;
    iframe.src = ''; // Clear the src
    iframe.src = src; // Reset the src
}

// Attach functions to the global window object
window.showTutorial = showTutorial;
window.closeTutorial = closeTutorial; 