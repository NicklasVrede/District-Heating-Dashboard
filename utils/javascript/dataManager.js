const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '.'
    : '/Visualisering';

import { getNetworkSplitState } from './networkSplit.js';

let cachedData = null;

export async function loadData() {
    if (cachedData) {
        return cachedData;
    }

    try {
        const isNetworkSplit = getNetworkSplitState();
        const dataFile = isNetworkSplit ? 'data_dict.json' : 'data_dict_merged.json';
        
        const response = await fetch(`${BASE_URL}/data/${dataFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        cachedData = await response.json();
        window.dataDict = cachedData;
        return cachedData;
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

export function getCachedData() {
    return cachedData;
}

export function clearCache() {
    cachedData = null;
    window.dataDict = null;
} 