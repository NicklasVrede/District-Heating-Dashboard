const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '.'
    : '/Visualisering';

let cachedData = null;

export async function loadData() {
    if (cachedData) {
        return cachedData;
    }

    try {
        const response = await fetch(`${BASE_URL}/data/data_dict.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        cachedData = await response.json();
        return cachedData;
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

export function getCachedData() {
    return cachedData;
} 