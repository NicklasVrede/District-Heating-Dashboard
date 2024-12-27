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
network_assignments = {}  # Track which network each ID should belong to
for _, row in mapping_df.iterrows():
    df.loc[df['forsyid'] == row['forsyid'], 'fv_net'] = row['fv_net']
    network_assignments[row['forsyid']] = row['fv_net']  # Store the correct network assignment

# Create mapping based on most recent fv_net assignment for each forsyid
latest_assignments = (df[df['fv_net'] != 0.0]
                     .sort_values('aar', ascending=False)  # Sort by year descending
                     .groupby('forsyid')
                     .first()  # Take first (most recent) record for each forsyid
                     .reset_index())

network_groups = latest_assignments.groupby('fv_net')['forsyid'].agg(list).to_dict()

# Debug the assignments
print("\nLatest network assignments:")
print("23104113:", latest_assignments[latest_assignments['forsyid'] == '23104113']['fv_net'].values)
print("32473660:", latest_assignments[latest_assignments['forsyid'] == '32473660']['fv_net'].values)

# Debug where 23104113 appears
print("\nChecking all networks containing 23104113:")
for net, ids in network_groups.items():
    if '23104113' in ids:
        print(f"Found 23104113 in network {net} with fv_net value: {df[df['forsyid'] == '23104113']['fv_net'].unique()}")

# Fix network assignments for problematic IDs
for net in network_groups:
    if net != 18.0:
        # Remove 32473660 from any other network
        network_groups[net] = [fid for fid in network_groups[net] if fid != '32473660']
    elif net == 18.0 and '32473660' not in network_groups[net]:
        # Add it to network 18 if it's not there
        network_groups[net].append('32473660')
        
    if net != 2.0:
        # Remove 23104113 from any other network
        network_groups[net] = [fid for fid in network_groups[net] if fid != '23104113']
    elif net == 2.0 and '23104113' not in network_groups[net]:
        # Add it to network 2 if it's not there
        network_groups[net].append('23104113')

# Verify 23104113 is now only in network 2
print("\nVerifying 23104113 network assignment:")
for net, ids in network_groups.items():
    if '23104113' in ids:
        print(f"After fix: 23104113 in network {net}")

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

# Add debugging for network 18 before processing
print("\nDebugging for network 18:")
network_18_ids = df[df['fv_net'] == 18.0]['forsyid'].tolist()
print(f"Initial forsyids in network 18 from production data: {network_18_ids}")
mapping_forsyids_18 = mapping_df[mapping_df['fv_net'] == 18.0]['forsyid'].tolist()
print(f"Additional forsyids from mapping file for network 18: {mapping_forsyids_18}")

# Track which IDs have been processed
processed_ids = set()

# Create the mapping
for network, forsyids in sorted(network_groups.items()):  # Sort by network number
    # Debug for network 2
    if network == 2.0:
        print(f"\nProcessing network 2:")
        print(f"Initial forsyids before filtering: {list(set(forsyids))}")
    
    # Only include IDs that either:
    # 1. Are assigned to this network in the mapping file
    # 2. Only appear in this network and aren't assigned elsewhere
    # 3. Are specifically 23104113 or 32473660 and in their correct networks
    forsyids = [fid for fid in forsyids if 
                (fid in network_assignments and network_assignments[fid] == network) or
                (fid not in network_assignments and 
                 all(fid not in other_ids for net, other_ids in network_groups.items() if net != network)) or
                (fid == '23104113' and network == 2.0) or
                (fid == '32473660' and network == 18.0)]
    
    if network == 2.0:
        print(f"After filtering: {list(set(forsyids))}")
    
    if not forsyids:  # Skip if no IDs to process
        continue
    
    forsyids.extend(mapping_df[mapping_df['fv_net'] == network]['forsyid'].tolist())
    forsyids = list(set(forsyids))
    
    if network == 2.0:
        print(f"After extending with mapping IDs: {forsyids}")
    
    # Add all processed IDs to the tracking set
    processed_ids.update(forsyids)
    
    valid_ids = [fid for fid in forsyids if not fid.startswith('0')]
    if valid_ids:
        min_id = min(valid_ids)
    else:
        min_id = next(fid for fid in sorted(forsyids) if int(fid) > 0)
    
    new_forsyid = f"{int(min_id):08d}"
    
    if network == 2.0:
        print(f"Selected new forsyid: {new_forsyid}")
        print(f"Creating mappings for these IDs: {forsyids} -> {new_forsyid}")
    
    # Create mappings
    for old_id in forsyids:
        forsyid_mapping[str(old_id)] = str(new_forsyid)

# Add debugging for network 18 after mapping
print("\nAfter creating all mappings:")
print("Final mapping for network 18 IDs:")
for old_id in network_18_ids + mapping_forsyids_18:
    print(f"ID {old_id} maps to: {forsyid_mapping.get(old_id, 'Not mapped')}")

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

