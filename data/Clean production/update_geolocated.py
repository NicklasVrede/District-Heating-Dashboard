import pandas as pd

# Read both files
df = pd.read_csv('data/Clean production/filtered_geolocated.csv')
mapping = pd.read_csv('data/Clean production/vaarknavn_mapping.csv')

# Create a dictionary from the mapping file
# Convert forsyid to 8-digit format in the mapping
mapping['forsyid'] = mapping['forsyid'].fillna(0).astype(int).apply(lambda x: f'{int(x):08d}')
mapping_dict = dict(zip(mapping['vaerk_navn'], mapping['forsyid']))

# Update forsyid where vaerk_navn matches and ensure 8-digit format
df['forsyid'] = df['vaerk_navn'].map(mapping_dict).fillna(df['forsyid'])
df['forsyid'] = df['forsyid'].fillna(0).astype(str).apply(lambda x: f'{int(float(x)):08d}')

# Save the updated file
df.to_csv('data/Clean production/filtered_geolocated_updated.csv', index=False)

