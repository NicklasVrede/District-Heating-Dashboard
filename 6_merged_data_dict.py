import pandas as pd
import json
import os
import geopandas as gpd
import csv

# Load and prepare merged production data
data_df = pd.read_csv('data/production_data_with_forsyid_merged.csv', encoding='utf-8')
data_df = data_df[data_df['forsyid'] != 0]  # Filter out unmatched plants
data_df['forsyid'] = data_df['forsyid'].astype(str).str.zfill(8)  # Convert to 8-digit strings

# Define energy columns (same as before)
energy_columns = [
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ',
    'lpg_TJ', 'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ',
    'trae- og biomasseaffald_TJ', 'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ',
    'solenergi_TJ', 'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ',
    'varmeprod_TJ', 'elprod_TJ'
]

# Create basic mappings using merged data
mappings = {
    'idrift': data_df.groupby('forsyid')['idriftdato'].min().to_dict(),  # Use earliest date
    'elkapacitet': data_df.groupby('forsyid')['elkapacitet_MW'].sum().to_dict(),  # Sum capacities
    'varmekapacitet': data_df.groupby('forsyid')['varmekapacitet_MW'].sum().to_dict()
}

# Load CVRP mapping from merged GeoJSON
with open('data/plants_merged.geojson', 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)
    forsyid_to_cvrp = {
        f['properties']['forsyid']: str(f['properties']['CVRP']).strip()
        for f in geojson_data['features']
        if 'forsyid' in f['properties'] and 'CVRP' in f['properties']
    }

# Calculate areas from merged areas file
areas_gdf = gpd.read_file('maps/areas_merged.geojson')
areas_gdf = areas_gdf.to_crs(epsg=32633)
aggregated_areas = (areas_gdf.geometry.area / 1_000_000).groupby(areas_gdf['forsyid']).sum().round(2)
aggregated_areas = aggregated_areas.to_dict()

# Process price files
def safe_float_convert(value, year=None, price_type=None):
    if pd.isna(value) or value == '-':
        return None
    try:
        # Simply convert to float and round to integer, removing any scaling
        raw_value = float(str(value).replace('.', '').replace(',', '.'))
        return int(round(raw_value))
    except (ValueError, TypeError):
        return None

price_data = {}
price_files = [
    ('fjernvarmepriser_jan_2019.csv', '2019'),
    ('fjernvarmepriser_jan_2020.csv', '2020'),
    ('fjernvarmepriser_jan_2021.csv', '2021'),
    ('fjernvarmepriser_jan_2022.csv', '2022'),
    ('fjernvarmepriser_jan_2023.csv', '2023'),
    ('fjernvarmepriser_jan_2024.csv', '2024')
]

# Create network grouping mapping
network_groups = {}
for forsyid in data_df['forsyid'].unique():
    network = data_df[data_df['forsyid'] == forsyid]['fv_net'].iloc[0]
    if network not in network_groups:
        network_groups[network] = []
    network_groups[network].append(forsyid)

# Process price files with averaging for networks
price_data = {}
for filename, year in price_files:
    try:
        df = pd.read_csv(f'data/prices/{filename}', sep=';', encoding='utf-8')
        network_prices = {}  # Store prices by network instead of by CVRP
        
        # First pass: collect all prices for each network
        for network, forsyids in network_groups.items():
            prices_in_network = []
            for forsyid in forsyids:
                cvrp = forsyid_to_cvrp.get(forsyid)
                if cvrp and str(cvrp) in df.iloc[:, 0].astype(str).values:
                    row = df[df.iloc[:, 0].astype(str) == str(cvrp)].iloc[0]
                    prices_in_network.append({
                        'mwh_price': safe_float_convert(row.iloc[3]),
                        'apartment_price': safe_float_convert(row.iloc[4]),
                        'house_price': safe_float_convert(row.iloc[5])
                    })
            
            if prices_in_network:
                # Calculate averages, ignoring None values
                avg_prices = {
                    'mwh_price': int(round(sum(p['mwh_price'] for p in prices_in_network if p['mwh_price'] is not None) / 
                                   sum(1 for p in prices_in_network if p['mwh_price'] is not None))) if any(p['mwh_price'] is not None for p in prices_in_network) else None,
                    'apartment_price': int(round(sum(p['apartment_price'] for p in prices_in_network if p['apartment_price'] is not None) / 
                                        sum(1 for p in prices_in_network if p['apartment_price'] is not None))) if any(p['apartment_price'] is not None for p in prices_in_network) else None,
                    'house_price': int(round(sum(p['house_price'] for p in prices_in_network if p['house_price'] is not None) / 
                                     sum(1 for p in prices_in_network if p['house_price'] is not None))) if any(p['house_price'] is not None for p in prices_in_network) else None
                }
                network_prices[network] = avg_prices
        
        price_data[year] = network_prices
    except Exception as e:
        print(f"Error processing {filename}: {e}")

# Load municipalities (same as before)
municipalities_gdf = gpd.read_file('maps/municipalities_with_forsyid.geojson')
valid_municipality_ids = set(municipalities_gdf['lau_1'].astype(str).str.zfill(8))

# Load population data
population_data = {}
with open('data/population_data.csv', 'r', encoding='utf-8') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    for row in csv_reader:
        if row['TID'] == '2024M01':  # Only get 2024 data
            population_data[row['OMRÅDE']] = int(row['INDHOLD'])

# Create final merged data dictionary
data_dict = {}
for forsyid, group in data_df.groupby(['forsyid', 'aar']).sum().groupby('forsyid'):
    padded_forsyid = str(forsyid).zfill(8)
    is_municipality = padded_forsyid in valid_municipality_ids
    
    # Get municipality name if it's a municipality
    municipality_name = None
    if is_municipality:
        municipality_name = municipalities_gdf.loc[
            municipalities_gdf['lau_1'].astype(str).str.zfill(8) == padded_forsyid, 
            'name'
        ].iloc[0] if not municipalities_gdf.empty else None

    # Get the network name from the production data - modified to get latest name
    network_name = data_df.loc[data_df['forsyid'] == padded_forsyid, 'fv_net_navn'].iloc[-1] if not data_df.loc[data_df['forsyid'] == padded_forsyid, 'fv_net_navn'].empty else 'Unknown'

    data_dict[padded_forsyid] = {
        'type': 'municipality' if is_municipality else 'plant',
        'name': municipality_name if is_municipality else network_name,
        'idrift': None if is_municipality else mappings['idrift'].get(forsyid),
        'elkapacitet_MW': mappings['elkapacitet'].get(forsyid, 0) or 0,
        'varmekapacitet_MW': mappings['varmekapacitet'].get(forsyid, 0) or 0,
        'total_area_km2': aggregated_areas.get(forsyid, 0) or 0,
        'population': population_data.get(municipality_name) if is_municipality else None,
        'CVRP': forsyid_to_cvrp.get(forsyid),
        'production': {
            str(year): {
                **{col.replace('_TJ', ''): int(round(val.iloc[0] if hasattr(val, 'iloc') else val or 0))
                   for col, val in yearly_data[energy_columns].items()},
            }
            for year, yearly_data in group.groupby('aar')
        }
    }
    
    # Add prices based on network membership
    prices = {}
    network = data_df[data_df['forsyid'] == padded_forsyid]['fv_net'].iloc[0]  # Get network for this forsyid
    for year in price_data.keys():  # Iterate through all years
        if network in price_data[year]:
            prices[year] = price_data[year][network]
        else:
            # Add null prices when network has no price data for that year
            prices[year] = {
                'mwh_price': None,
                'apartment_price': None,
                'house_price': None
            }
    
    # Always add prices to data_dict, even if empty
    data_dict[padded_forsyid]['prices'] = prices

# Save the merged data dictionary
with open('data/data_dict_merged.json', 'w', encoding='utf-8') as f:
    json.dump(data_dict, f, indent=4, ensure_ascii=False)

print("Merged data dictionary created successfully.")
