export const graphConfig = {
    // Colors for each attribute
    colors: {
        'Kul': 'black',
        'Olie': 'brown',
        'Gas': 'gray',
        'Affald': 'lightgreen',
        'Biogas': 'lime',
        'Skovflis': 'green',
        'Halm': 'yellow',
        'Træaffald': 'darkorange',
        'Træpiller': 'peru',
        'Biobrændsler (bioolie)': 'olive',
        'Solvarme': 'gold',
        'Varmepumper': 'purple',
        'Elektricitet': 'blue'
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
        'Olie': ['fuelolie', 'spildolie', 'gasolie'],
        'Gas': ['naturgas', 'lpg', 'raffinaderigas'],
        'Affald': 'affald',
        'Biogas': 'biogas',
        'Skovflis': 'skovflis',
        'Halm': 'halm',
        'Træaffald': 'trae- og biomasseaffald',
        'Træpiller': 'traepiller',
        'Biobrændsler (bioolie)': 'bio-olie',
        'Varmepumper': ['omgivelsesvarme', 'braendselsfrit'],
        'Solvarme': 'solenergi',
        'Elektricitet': 'elektricitet'
    }
}; 