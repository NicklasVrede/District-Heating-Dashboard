function showTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'flex';

    // Add event listener to close modal when clicking on it
    modal.addEventListener('click', handleModalClick);
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    modal.style.display = 'none';

    // Stop the video by resetting the src
    const iframe = modal.querySelector('iframe');
    const src = iframe.src;
    iframe.src = ''; // Clear the src
    iframe.src = src; // Reset the src

    // Remove the event listener when modal is closed
    modal.removeEventListener('click', handleModalClick);
}

function handleModalClick(event) {
    const modalContent = document.querySelector('.tutorial-content');
    console.log('Clicked element:', event.target);

    if (!modalContent.contains(event.target)) {
        console.log('Click detected outside modal content. Closing modal.');
        closeTutorial();
    } else {
        console.log('Click detected inside modal content.');
    }
}

// Attach functions to the global window object
window.showTutorial = showTutorial;
window.closeTutorial = closeTutorial; 