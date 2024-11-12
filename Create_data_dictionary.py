import pandas as pd
import json
import os
import geopandas as gpd

# Load and prepare production data
data_df = pd.read_csv('data/production_data_with_forsyid.csv', encoding='utf-8')
data_df = data_df[data_df['forsyid'] != 0]  # Filter out unmatched plants
data_df['forsyid'] = data_df['forsyid'].astype(str).str.zfill(8)  # Convert to 8-digit strings

# Define mappings and columns
energy_columns = [
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ',
    'lpg_TJ', 'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ',
    'trae- og biomasseaffald_TJ', 'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ',
    'solenergi_TJ', 'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ'
]

# Create basic mappings (convert Series to native Python types)
mappings = {
    'name': data_df.groupby('forsyid')['plant_name'].first().to_dict(),
    'idrift': data_df.groupby('forsyid')['idriftdato'].first().to_dict(),
    'elkapacitet': data_df.groupby('forsyid')['elkapacitet_MW'].first().to_dict(),
    'varmekapacitet': data_df.groupby('forsyid')['varmekapacitet_MW'].first().to_dict()
}

# Load CVRP mapping from GeoJSON
with open('data/plants.geojson', 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)
    forsyid_to_cvrp = {
        f['properties']['forsyid']: str(f['properties']['CVRP']).strip()
        for f in geojson_data['features']
        if 'forsyid' in f['properties'] and 'CVRP' in f['properties']
    }

# Calculate areas
areas_gdf = gpd.read_file('maps/areas.geojson')
areas_gdf = areas_gdf.to_crs(epsg=32633)
aggregated_areas = (areas_gdf.geometry.area / 1_000_000).groupby(areas_gdf['forsyid']).sum().round(2)

# Convert areas to dictionary
aggregated_areas = aggregated_areas.to_dict()

# Process price files
def safe_float_convert(value, year=None, price_type=None):
    if pd.isna(value) or value == '-':
        return None
    try:
        raw_value = float(str(value).replace('.', '').replace(',', '.'))
        if price_type == 'mwh_price' and year == '2022':
            raw_value *= 0.1
        if price_type in ['apartment_price', 'house_price'] and year == '2019':
            raw_value *= 0.1
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

for filename, year in price_files:
    try:
        df = pd.read_csv(f'data/prices/{filename}', sep=';', encoding='utf-8')
        price_dict = {}
        for _, row in df.iterrows():
            price_dict[str(row['PNummer'])] = {
                'mwh_price': safe_float_convert(row.get('MWhPrisInklMoms'), year, 'mwh_price'),
                'apartment_price': safe_float_convert(row.get('SamletForbugerprisBeboelseslejlighedInklMoms'), year, 'apartment_price'),
                'house_price': safe_float_convert(row.get('SamletForbugerprisEnfamilieshusInklMoms'), year, 'house_price')
            }
        price_data[year] = price_dict
    except Exception as e:
        print(f"Error processing {filename}: {e}")

# Create final data dictionary
data_dict = {}
for forsyid, group in data_df.groupby(['forsyid', 'aar']).sum().groupby('forsyid'):
    data_dict[forsyid] = {
        'name': mappings['name'].get(forsyid, 'Unknown'),
        'idrift': mappings['idrift'].get(forsyid),
        'elkapacitet_MW': mappings['elkapacitet'].get(forsyid, 0) or 0,
        'varmekapacitet_MW': mappings['varmekapacitet'].get(forsyid, 0) or 0,
        'total_area_km2': aggregated_areas.get(forsyid, 0) or 0,
        'production': {
            str(year): {col.replace('_TJ', ''): int(round(val.iloc[0] if hasattr(val, 'iloc') else val or 0))
                       for col, val in yearly_data[energy_columns].items()}
            for year, yearly_data in group.groupby('aar')
        }
    }
    
    # Add prices if available
    cvrp = forsyid_to_cvrp.get(forsyid)
    if cvrp:
        prices = {year: prices[cvrp.strip()] 
                 for year, prices in price_data.items() 
                 if cvrp.strip() in prices}
        if prices:
            data_dict[forsyid]['prices'] = prices

# Save the data
with open('data/data_dict.json', 'w', encoding='utf-8') as f:
    json.dump(data_dict, f, indent=4, ensure_ascii=False)