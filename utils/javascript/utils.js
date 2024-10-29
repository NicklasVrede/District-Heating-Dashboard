// Utility function to capitalize the first letter of each word and return the first two words
export function capitalizeFirstLetters(str) {
    // Check if the text is "Fjernvarme under rekonstruktion"
    if (str === 'Fjernvarme under rekonstruktion') {
        return str;
    }

    return str.toLowerCase()
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Define a delay function
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}