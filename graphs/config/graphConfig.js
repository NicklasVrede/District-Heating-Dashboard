export const graphConfig = {
    // Colors for each attribute
    colors: {
        'Kul': '#2C3E50',
        'Olie': '#8E44AD',
        'Gas': '#E74C3C',
        'Affald': '#95A5A6',
        'Bioaffald': '#27AE60',
        'Biogas & Bioolie': '#A8E6CF',
        'Træ-biomasse': '#8B4513',
        'Halm': '#FF7F00',
        'Brændselsfrit': '#3498DB',
        'Solvarme': '#F1C40F',
        'El': '#4834d4'
    },

    // List of attributes for the graphs
    attributes: [
        'Coal',
        'Oli', 
        'Gas', 
        'Affald',
        'Biogas',
        'Skovflis',
        'Halm',
        'Træaffald',
        'Træpiller',
        'Biobrændsler (bioolie)',
        'Solvarme',
        'Varmepumper',
        'Elektricitet'
    ],

    // Fuel type mappings
    fuelTypes: {
        'Kul': 'kul',
        'Olie': ['fuelolie', 'gasolie'],
        'Gas': ['naturgas', 'lpg', 'raffinaderigas'],
        'Affald': 'affald',
        'Bioaffald': ['spildolie', 'trae- og biomasseaffald'],
        'Biogas & Bioolie': ['biogas', 'bio-olie'],
        'Træ-biomasse': ['skovflis', 'traepiller'],
        'Halm': 'halm',
        'Brændselsfrit': ['omgivelsesvarme', 'braendselsfrit', 'vandkraft'],
        'Solvarme': 'solenergi',
        'El': ['elektricitet']
    }
}; 