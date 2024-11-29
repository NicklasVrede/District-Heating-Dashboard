export const graphConfig = {
    // Colors for each attribute
    colors: {
        'Kul': '#000000',
        'Olie': '#A349A4',
        'Gas': '#ED1C24',
        'Affald': '#7F7F7F',
        'Bioaffald': '#228B22',
        'Biogas & Bioolie': '#B5E61D',
        'Træ-biomasse': '#904414',
        'Halm': '#ff7c24',
        'Brændselsfrit': '#0ca8ec',
        'Solvarme': '#fff404',
        'El': '#0804fc'
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