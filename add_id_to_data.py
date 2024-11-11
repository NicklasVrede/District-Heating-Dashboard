import pandas as pd

# Load the data
plants_df = pd.read_csv('data/plants.csv')
mapping_df = pd.read_csv('data/old/data_names_mapping.csv')
production_df = pd.read_csv('data/production_data.csv')

# Clean the data
plants_df['name'] = plants_df['name'].str.strip()
mapping_df['Unique Names in data'] = mapping_df['Unique Names in data'].str.strip()
mapping_df['Names of plants'] = mapping_df['Names of plants'].str.strip()

# Create a dictionary for mapping production names to plant names
name_mapping = dict(zip(mapping_df['Unique Names in data'], mapping_df['Names of plants']))

# Create a dictionary for mapping plant names to forsyids
forsyid_mapping = dict(zip(plants_df['name'], plants_df['forsyid'].astype(int)))

# Add plant_name column using the mapping
production_df['plant_name'] = production_df['fv_net_navn'].map(name_mapping)

# Add forsyid using the plant name and ensure 8 digits
production_df['forsyid'] = production_df['plant_name'].map(forsyid_mapping)
production_df['forsyid'] = production_df['forsyid'].fillna(0).astype(int)
production_df['forsyid'] = production_df['forsyid'].apply(lambda x: f'{int(x):08d}')

# Sort by plant name
production_df = production_df.sort_values('plant_name')

# Reorder columns to put forsyid second
cols = production_df.columns.tolist()
cols.remove('forsyid')
cols.insert(1, 'forsyid')
production_df = production_df[cols]

# Save the result
production_df.to_csv('data/production_data_with_forsyid.csv', index=False)

# Print statistics
print(f"Total production entries: {len(production_df)}")
print(f"Entries with matched plant names: {production_df['plant_name'].notna().sum()}")
print(f"Entries with matched forsyids: {production_df['forsyid'].notna().sum()}")
print("\nAll unmatched entries:")
print(production_df[production_df['forsyid'].isna()][['fv_net_navn', 'plant_name']].to_string())