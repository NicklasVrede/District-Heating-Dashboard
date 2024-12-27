import pandas as pd
import json
import os
import geopandas as gpd
import csv

# Load and prepare merged production data
data_df = pd.read_csv('data/production_data_with_forsyid_merged.csv', encoding='utf-8')
data_df = data_df[data_df['forsyid'] != 0]  # Filter out unmatched plants
data_df['forsyid'] = data_df['forsyid'].astype(str).str.zfill(8)

# Load merged plants and areas
plants_gdf = gpd.read_file('data/plants_merged.geojson')
areas_gdf = gpd.read_file('maps/areas_merged.geojson')
plants_gdf['forsyid'] = plants_gdf['forsyid'].astype(str).str.zfill(8)
areas_gdf['forsyid'] = areas_gdf['forsyid'].astype(str).str.zfill(8)

# Define energy columns (same as before)
energy_columns = [
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ',
    'lpg_TJ', 'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ',
    'trae- og biomasseaffald_TJ', 'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ',
    'solenergi_TJ', 'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ',
    'varmeprod_TJ', 'elprod_TJ'
]

# Create basic mappings with aggregated values
mappings = {
    'name': plants_gdf.groupby('forsyid')['name'].first().to_dict(),
    'idrift': data_df.groupby('forsyid')['idriftdato'].min().to_dict(),  # Earliest commissioning date
    'elkapacitet': data_df.groupby('forsyid')['elkapacitet_MW'].sum().to_dict(),  # Sum capacities
    'varmekapacitet': data_df.groupby('forsyid')['varmekapacitet_MW'].sum().to_dict()
}

# Aggregate CVRP numbers (keep all unique CVRPs per network)
forsyid_to_cvrp = {}
for _, group in plants_gdf.groupby('forsyid'):
    cvrps = group['CVRP'].dropna().unique()
    if len(cvrps) > 0:
        forsyid_to_cvrp[group['forsyid'].iloc[0]] = [str(cvrp).strip() for cvrp in cvrps]

# Calculate aggregated areas
areas_gdf = areas_gdf.to_crs(epsg=32633)
aggregated_areas = (areas_gdf.geometry.area / 1_000_000).groupby(areas_gdf['forsyid']).sum().round(2)
aggregated_areas = aggregated_areas.to_dict()

# Add safe_float_convert function
def safe_float_convert(value, year=None, price_type=None):
    if pd.isna(value) or value == '-':
        return None
    try:
        # Simply convert to float and round to integer, removing any scaling
        raw_value = float(str(value).replace('.', '').replace(',', '.'))
        return int(round(raw_value))
    except (ValueError, TypeError):
        return None

# Add price data loading
price_data = {}
price_files = [
    ('fjernvarmepriser_jan_2019.csv', '2019'),
    ('fjernvarmepriser_jan_2020.csv', '2020'),
    ('fjernvarmepriser_jan_2021.csv', '2021'),
    ('fjernvarmepriser_jan_2022.csv', '2022'),
    ('fjernvarmepriser_jan_2023.csv', '2023'),
    ('fjernvarmepriser_jan_2024.csv', '2024')
]

for filename, year in price_files:
    try:
        df = pd.read_csv(f'data/prices/{filename}', sep=';', encoding='utf-8')
        price_dict = {}
        for _, row in df.iterrows():
            price_dict[str(row.iloc[0])] = {
                'mwh_price': safe_float_convert(row.iloc[3]),
                'apartment_price': safe_float_convert(row.iloc[4]),
                'house_price': safe_float_convert(row.iloc[5])
            }
        price_data[year] = price_dict
    except Exception as e:
        print(f"Error processing {filename}: {e}")

# Load municipalities from GeoJSON to get valid municipality IDs
municipalities_gdf = gpd.read_file('maps/municipalities_with_forsyid.geojson')
valid_municipality_ids = set(municipalities_gdf['lau_1'].astype(str).str.zfill(8))

# Load population data
population_data = {}
with open('data/population_data.csv', 'r', encoding='utf-8') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    for row in csv_reader:
        if row['TID'] == '2024M01':  # Only get 2024 data
            population_data[row['OMRÅDE']] = int(row['INDHOLD'])

# Create final data dictionary with merged data
data_dict = {}
for forsyid, group in data_df.groupby(['forsyid', 'aar']).sum().groupby('forsyid'):
    padded_forsyid = str(forsyid).zfill(8)
    
    # Check if municipality (same as before)
    is_municipality = padded_forsyid in valid_municipality_ids
    municipality_name = None
    if is_municipality:
        municipality_name = municipalities_gdf.loc[
            municipalities_gdf['lau_1'].astype(str).str.zfill(8) == padded_forsyid, 
            'name'
        ].iloc[0] if not municipalities_gdf.empty else None

    # Get all CVRPs for this network
    network_cvrps = forsyid_to_cvrp.get(padded_forsyid, [])
    
    # Calculate average prices across all CVRPs in the network
    network_prices = {}
    if network_cvrps:
        for year, year_prices in price_data.items():
            prices_for_year = [
                year_prices[cvrp] for cvrp in network_cvrps 
                if cvrp in year_prices
            ]
            if prices_for_year:
                network_prices[year] = {
                    'mwh_price': int(round(sum(p['mwh_price'] for p in prices_for_year if p['mwh_price']) / len(prices_for_year))),
                    'apartment_price': int(round(sum(p['apartment_price'] for p in prices_for_year if p['apartment_price']) / len(prices_for_year))),
                    'house_price': int(round(sum(p['house_price'] for p in prices_for_year if p['house_price']) / len(prices_for_year)))
                }

    data_dict[padded_forsyid] = {
        'type': 'municipality' if is_municipality else 'plant',
        'name': municipality_name if is_municipality else mappings['name'].get(forsyid, 'Unknown'),
        'idrift': None if is_municipality else mappings['idrift'].get(forsyid),
        'elkapacitet_MW': mappings['elkapacitet'].get(forsyid, 0) or 0,
        'varmekapacitet_MW': mappings['varmekapacitet'].get(forsyid, 0) or 0,
        'total_area_km2': aggregated_areas.get(forsyid, 0) or 0,
        'population': population_data.get(municipality_name) if is_municipality else None,
        'CVRP': network_cvrps,  # Now a list of CVRPs
        'production': {
            str(year): {
                **{col.replace('_TJ', ''): int(round(val.iloc[0] if hasattr(val, 'iloc') else val or 0))
                   for col, val in yearly_data[energy_columns].items()},
            }
            for year, yearly_data in group.groupby('aar')
        }
    }
    
    # Add averaged prices if available
    if network_prices:
        data_dict[padded_forsyid]['prices'] = network_prices

# Load the original data dictionary to get municipality entries
with open('data/data_dict.json', 'r', encoding='utf-8') as f:
    original_data_dict = json.load(f)

# Add municipality entries from the original dictionary
for forsyid, entry in original_data_dict.items():
    if entry.get('type') == 'municipality':
        data_dict[forsyid] = entry

# Save the merged data dictionary
with open('data/data_dict_merged.json', 'w', encoding='utf-8') as f:
    json.dump(data_dict, f, indent=4, ensure_ascii=False)

print("Merged data dictionary created successfully.") 