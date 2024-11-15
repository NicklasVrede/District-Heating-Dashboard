export const tooltipStyle = `
    position: fixed;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    pointer-events: none;
    z-index: 1000;
    max-width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    opacity: 1;
    transition: opacity 0.15s ease;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
`;

export const legendTooltips = {
    production: {
        'Kul': 'Energy from coal combustion',
        'Olie': 'Energy from petroleum products including fuel oil and gas oil',
        'Gas': 'Energy from natural gas, LPG (Liquefied Petroleum Gas), and refinery gas',
        'Affald': 'Energy from waste incineration',
        'Bioaffald': 'Energy from waste bio-sources including waste oil and wood/biomass waste',
        'Biogas & Bioolie': 'Energy from biogas and bio-oil sources',
        'Træ-biomasse': 'Energy from wood-based biomass including wood chips and wood pellets',
        'Halm': 'Energy from straw combustion',
        'Brændselsfrit': 'Energy from fuel-free sources including ambient heat, hydropower, and other fuel-free sources',
        'Solvarme': 'Energy from solar thermal systems',
        'El': 'Energy from electricity'
    },
    prices: {
        'MWh Price': 'Price per megawatt-hour of energy',
        'Apartment Price': 'District heating price for apartments 70 m²',
        'House Price': 'District heating price for houses 130 m²'
    }
}; 