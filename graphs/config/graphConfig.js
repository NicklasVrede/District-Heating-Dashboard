export const graphConfig = {
    // Colors for each attribute
    colors: {
        'Kul': '#000000',
        'Olie': '#8B4513',
        'Gas': '#808080',
        'Affald': '#90EE90',
        'Bioaffald': '#228B22',
        'Biogas & Bioolie': '#32CD32',
        'Træ-biomasse': '#8B4513',
        'Halm': '#FFD700',
        'Brændselsfrit': '#9370DB',
        'Solvarme': '#FFA500',
        'El': '#0000FF'
    },

    // List of attributes for the graphs
    attributes: [
        'Kul',
        'Olie', 
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