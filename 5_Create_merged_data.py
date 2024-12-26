import pandas as pd
import geopandas as gpd

file_path = 'data/Clean production/production_data.csv'
file_path_plants = 'data/plants.geojson'
file_path_areas = 'maps/areas.geojson'
file_path_mapping = 'data/forsy_fv_net_mapping.csv'

# Read input files
df = pd.read_csv(file_path)
plants_gdf = gpd.read_file(file_path_plants)
areas_gdf = gpd.read_file(file_path_areas)
mapping_df = pd.read_csv(file_path_mapping)

# Convert forsyid to string in all dataframes to ensure consistent handling
df['forsyid'] = df['forsyid'].astype(str).str.zfill(8)
plants_gdf['forsyid'] = plants_gdf['forsyid'].astype(str).str.zfill(8)
areas_gdf['forsyid'] = areas_gdf['forsyid'].astype(str).str.zfill(8)
mapping_df['forsyid'] = mapping_df['forsyid'].astype(str).str.zfill(8)

# Create initial mapping from the mapping file
forsyid_mapping = {}
for _, row in mapping_df.iterrows():
    df.loc[df['forsyid'] == row['forsyid'], 'fv_net'] = row['fv_net']

# Add debugging before any processing
print("\nInitial state for 23104113:")
print("In production data:", df[df['forsyid'] == '23104113'])
print("In mapping file:", mapping_df[mapping_df['forsyid'] == '23104113'])
print("FV_net value:", df.loc[df['forsyid'] == '23104113', 'fv_net'].values)

# Create mapping based on fv_net grouping, excluding 0.0
network_groups = df[df['fv_net'] != 0.0].groupby('fv_net')['forsyid'].agg(list).to_dict()

# Debug network groups
print("\nNetwork groups containing 23104113:")
for net, ids in network_groups.items():
    if '23104113' in ids:
        print(f"Found in network {net}")

# Add debugging for network 2
print("\nDebugging for fv_net 2:")
if 2.0 in network_groups:
    print(f"Initial forsyids in network 2: {network_groups[2.0]}")
    mapping_forsyids_2 = mapping_df[mapping_df['fv_net'] == 2.0]['forsyid'].tolist()
    print(f"Additional forsyids from mapping file: {mapping_forsyids_2}")

# Track which IDs have been processed
processed_ids = set()

# Create the mapping
for network, forsyids in sorted(network_groups.items()):  # Sort by network number
    mapping_forsyids = mapping_df[mapping_df['fv_net'] == network]['forsyid'].tolist()
    
    # Filter out already processed IDs
    forsyids = [fid for fid in forsyids if fid not in processed_ids]
    if not forsyids:  # Skip if no unprocessed IDs
        continue
    
    if network == 2.0:
        print(f"\nProcessing network 2:")
        print(f"Before extending: {forsyids}")
    
    forsyids.extend(mapping_forsyids)
    forsyids = list(set(forsyids))
    
    if network == 2.0:
        print(f"After extending and deduping: {forsyids}")
    
    valid_ids = [fid for fid in forsyids if not fid.startswith('0')]
    if valid_ids:
        min_id = min(valid_ids)
    else:
        min_id = next(fid for fid in sorted(forsyids) if int(fid) > 0)
    
    new_forsyid = f"{int(min_id):08d}"
    
    if network == 2.0:
        print(f"Selected new forsyid: {new_forsyid}")
        print(f"Mapping will be created for these IDs: {forsyids} -> {new_forsyid}")
    
    # Add all processed IDs to the tracking set
    processed_ids.update(forsyids)
    
    # Create mappings
    for old_id in forsyids:
        forsyid_mapping[str(old_id)] = str(new_forsyid)
        if network == 2.0:
            print(f"Creating mapping: {old_id} -> {new_forsyid}")

# Before applying mapping
print("\nBefore applying mapping:")
print("Mapping entry:", forsyid_mapping.get('23104113'))
print("Current record:", df[df['forsyid'] == '23104113'])

# Update production data with more detailed error checking
print("\nApplying mapping...")
old_value = df.loc[df['forsyid'] == '23104113', 'forsyid'].iloc[0] if len(df[df['forsyid'] == '23104113']) > 0 else None
df['forsyid'] = df['forsyid'].map(lambda x: forsyid_mapping.get(x, x))

# After mapping
print("\nAfter applying mapping:")
print("Old value was:", old_value)
print("New records with 23104113:", df[df['forsyid'] == '23104113'])
print("Records that should contain it:", df[df['forsyid'] == forsyid_mapping.get('23104113')])

# Update plants and areas based on the production data forsyids
for old_id in plants_gdf['forsyid'].unique():
    if old_id in forsyid_mapping:
        mask = plants_gdf['forsyid'] == old_id
        plants_gdf.loc[mask, 'forsyid'] = forsyid_mapping[old_id]

for old_id in areas_gdf['forsyid'].unique():
    if old_id in forsyid_mapping:
        areas_gdf.loc[areas_gdf['forsyid'] == old_id, 'forsyid'] = forsyid_mapping[old_id]

# Save merged versions with new filenames
df.to_csv('data/production_data_with_forsyid_merged.csv', index=False)
plants_gdf.to_file('data/plants_merged.geojson', driver='GeoJSON')
areas_gdf.to_file('maps/areas_merged.geojson', driver='GeoJSON')

