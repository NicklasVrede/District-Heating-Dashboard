import pandas as pd

# Step 1: Load the data from data/data_om_fv.csv
data_df = pd.read_csv('data/data_om_fv.csv')
print("First few rows of data_df:")
print(data_df.head())

# Step 2: Load the mapping from data/data_names_mapping.csv
names_mapping_df = pd.read_csv('data/data_names_mapping.csv')
print("First few rows of names_mapping_df:")
print(names_mapping_df.head())

# Step 3: Load the plant-to-area mapping from data/plant_to_areas_map.csv
plant_to_areas_mapping_df = pd.read_csv('data/plant_to_areas_map.csv')
print("First few rows of plant_to_areas_mapping_df:")
print(plant_to_areas_mapping_df.head())

# Step 4: Merge the data to add unique IDs
# Merge names_mapping_df with plant_to_areas_mapping_df to get the forsyid
mapping_with_ids = pd.merge(names_mapping_df, plant_to_areas_mapping_df, left_on='Names of plants', right_on='name', how='left')
print("First few rows of mapping_with_ids:")
print(mapping_with_ids.head())

# Merge the mapping_with_ids with data_df to add the forsyid to the data
data_with_ids = pd.merge(data_df, mapping_with_ids[['Unique Names in data', 'forsyid']], left_on='names', right_on='Unique Names in data', how='left')
print("First few rows of data_with_ids:")

# Drop the 'Unique Names in data' column
data_with_ids = data_with_ids.drop(columns=['Unique Names in data'])
print(data_with_ids.head())

# Convert the 'forsyid' column to integers
data_with_ids['forsyid'] = data_with_ids['forsyid'].astype('Int64')

# Step 5: Save the updated data_om_fv.csv
data_with_ids.to_csv('data/updated_data_om_fv.csv', index=False)

print('Updated data_om_fv.csv with unique IDs')