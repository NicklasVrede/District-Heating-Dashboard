import json
import pandas as pd
import geopandas as gpd
import glob

# Load municipalities GeoJSON
municipalities_gdf = gpd.read_file('maps/municipalities_with_forsyid.geojson')

# Load plants CSV
plants_df = pd.read_csv('data/plants.csv')

# Create a mapping from forsyid to CVRP
forsyid_to_cvrp = {}
for index, row in plants_df.iterrows():
    forsyid = str(int(row['forsyid'])).strip()  # Convert to int first to remove leading zeros
    cvrp = row['CVRP']
    if forsyid and cvrp:  # Ensure both forsyid and CVRP are not None
        # Add debug print
        print(f"Adding mapping: forsyid '{forsyid}' -> CVRP '{cvrp}'")
        forsyid_to_cvrp[forsyid] = cvrp

# Debugging: Print the mapping in a more readable format
print("\nForsyid to CVRP mapping:")
for forsyid, cvrp in forsyid_to_cvrp.items():
    print(f"  {forsyid}: {cvrp}")

# Create a dictionary to hold CVRPs grouped by lau_1
cvrp_by_lau1 = {}
for index, row in municipalities_gdf.iterrows():
    lau_1 = row['lau_1']
    forsyids = [str(int(fid.strip())) for fid in row['forsyids'].split(',') if fid.strip()]

    # Debugging: Print the forsyids being processed
    print(f"\nProcessing Lau_1: {lau_1}")
    print(f"  Forsyids: {', '.join(forsyids)}")
    print(f"  Looking up forsyid '17' in mapping: {'17' in forsyid_to_cvrp}")
    print(f"  Available forsyids in mapping: {list(forsyid_to_cvrp.keys())[:5]}...")

    cvrps = [forsyid_to_cvrp[fid] for fid in forsyids if fid in forsyid_to_cvrp]
    
    # Debugging: Print the collected CVRPs for each lau_1
    print(f"  CVRPs: {', '.join(map(str, cvrps))}\n")
    
    if lau_1 not in cvrp_by_lau1:
        cvrp_by_lau1[lau_1] = []
    cvrp_by_lau1[lau_1].extend(cvrps)

# Load price data from CSV files
price_files = glob.glob('data/prices/*.csv')
years = []
cvrp_to_prices = {}

for file in price_files:
    # Extract year from filename (assuming format like 'fjernvarmepriser_jan_2024.csv')
    year = file.split('_')[-1].split('.')[0]
    years.append(year)
    
    price_df = pd.read_csv(file, sep=';')
    if 'PNummer' not in price_df.columns:
        print(f"'PNummer' column not found in {file}. Available columns: {price_df.columns.tolist()}")
        continue

    for index, row in price_df.iterrows():
        pnummer = row['PNummer']
        if pnummer not in cvrp_to_prices:
            cvrp_to_prices[pnummer] = {}
        
        cvrp_to_prices[pnummer][year] = {
            'mwh_prices': pd.to_numeric(row['MWhPrisInklMoms'], errors='coerce'),
            'beboelseslejlighed_prices': pd.to_numeric(row['SamletForbugerprisBeboelseslejlighedInklMoms'], errors='coerce'),
            'enfamilieshus_prices': pd.to_numeric(row['SamletForbugerprisEnfamilieshusInklMoms'], errors='coerce')
        }

# Calculate average prices for each lau_1 and year
average_prices_by_lau1 = {}
for lau_1, cvrps in cvrp_by_lau1.items():
    average_prices_by_lau1[lau_1] = {}
    
    for year in years:
        prices = []
        beboelseslejlighed_prices = []
        enfamilieshus_prices = []
        
        for cvrp in cvrps:
            if cvrp in cvrp_to_prices and year in cvrp_to_prices[cvrp]:
                price_data = cvrp_to_prices[cvrp][year]
                if not pd.isna(price_data['mwh_prices']):
                    prices.append(price_data['mwh_prices'])
                if not pd.isna(price_data['beboelseslejlighed_prices']):
                    beboelseslejlighed_prices.append(price_data['beboelseslejlighed_prices'])
                if not pd.isna(price_data['enfamilieshus_prices']):
                    enfamilieshus_prices.append(price_data['enfamilieshus_prices'])
        
        if prices or beboelseslejlighed_prices or enfamilieshus_prices:
            average_prices_by_lau1[lau_1][year] = {
                'average_mwh_price': sum(prices) / len(prices) if prices else None,
                'average_beboelseslejlighed_price': sum(beboelseslejlighed_prices) / len(beboelseslejlighed_prices) if beboelseslejlighed_prices else None,
                'average_enfamilieshus_price': sum(enfamilieshus_prices) / len(enfamilieshus_prices) if enfamilieshus_prices else None
            }

# Load and update the data dictionary
with open('data/data_dict.json', 'r', encoding='utf-8') as f:
    data_dict = json.load(f)

# Add the calculated prices to the data dictionary
for lau_1, yearly_prices in average_prices_by_lau1.items():
    municipality_key = str(lau_1).zfill(8)
    if municipality_key in data_dict:
        data_dict[municipality_key]['prices'] = {}
        for year, prices in yearly_prices.items():
            data_dict[municipality_key]['prices'][year] = {
                'mwh_price': int(round(prices['average_mwh_price'])) if prices['average_mwh_price'] is not None else None,
                'apartment_price': int(round(prices['average_beboelseslejlighed_price'])) if prices['average_beboelseslejlighed_price'] is not None else None,
                'house_price': int(round(prices['average_enfamilieshus_price'])) if prices['average_enfamilieshus_price'] is not None else None
            }

# Save the updated data dictionary
with open('data/data_dict.json', 'w', encoding='utf-8') as f:
    json.dump(data_dict, f, indent=4, ensure_ascii=False)

print("Data dictionary updated with municipality prices for all years successfully.")

