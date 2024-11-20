import geopandas as gpd
import pandas as pd

file_path = 'maps/municipalities_with_forsyid.geojson'
data_path = 'data/production_data_with_forsyid.csv'
output_path = 'data/aggregated_data.csv'  # New output file path

# Load the GeoJSON file
gdf = gpd.read_file(file_path)

# Load the production data
production_data = pd.read_csv(data_path, header=0)  # Use the first row as header

# Define the column names for the production data
production_data.columns = [
    'fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 'DB07', 'NR117', 
    'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 'brutto_TJ', 'varmeprod_TJ', 
    'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 'andel_varmelev', 'andel_el', 'andel_process', 
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 
    'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ', 
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ', 'vandkraft_TJ', 
    'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id', 'vrkanl_ny', 'vaerk_navn', 
    'vaerk_postnr', 'vaerk_postdistrikt', 'fv_net', 'selskab_id', 'cvr', 'selskab_navn', 
    'vrktypeid', 'vrktypenavn', 'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 
    'skrotdato'
]

# Create a mapping from forsyid to municipality (lau_1) and label_dk
forsyid_to_lau1 = {}
forsyid_to_label_dk = {}
for index, row in gdf.iterrows():
    forsyids_for_lau = row['forsyids'].split(', ')
    for forsyid in forsyids_for_lau:
        if forsyid:  # Check if forsyid is not empty
            forsyid_to_lau1[int(forsyid)] = row['lau_1']  # Store as integer
            forsyid_to_label_dk[int(forsyid)] = row['label_dk']  # Store municipality name

# Print each forsyid and its corresponding label_dk
for forsyid, label in forsyid_to_label_dk.items():
    print(f"Forsyid: {forsyid}, Label DK: {label}")

# Map the forsyid in production_data to their corresponding municipality (lau_1) and label_dk
production_data['municipality'] = production_data['forsyid'].map(forsyid_to_lau1)
production_data['label_dk'] = production_data['forsyid'].map(forsyid_to_label_dk)  # Add label_dk
production_data['lau_1'] = production_data['forsyid'].map(forsyid_to_lau1)  # Add lau_1

# Specify aggregation functions
aggregation_functions = {
    'fv_net_navn': lambda x: max(x, key=len),  # Keep longest value for fv_net_navn
    'vaerk_id': 'first',
    'vrkanl_ny': 'first',
    'vaerk_navn': 'first',
    'vaerk_postnr': 'first',
    'vaerk_postdistrikt': 'first',
    'vaerk_kommune': 'first',
    'fv_net': 'first',
    'selskab_id': 'first',
    'cvr': 'first',
    'selskab_navn': 'first',
    'kvoteaktivitet': 'first',
    'vrktypeid': 'first',
    'vrktypenavn': 'first',
    'anlaeg_navn': 'first',
    'anlaegstype_navn': 'first',
    'DB07': 'first',
    'NR117': 'first',
    'aktoer': 'first',
    'idriftdato': 'min',  # Keep earliest dates
    'skrotdato': 'max',  # Keep latest dates
    # Sum numeric columns
    'indfyretkapacitet_MW': 'sum',
    'elkapacitet_MW': 'sum',
    'varmekapacitet_MW': 'sum',
    'brutto_TJ': 'sum',
    'varmeprod_TJ': 'sum',
    'varmelev_TJ': 'sum',
    'elprod_TJ': 'sum',
    'ellev_TJ': 'sum',
    'andel_varmelev': 'mean',
    'andel_el': 'mean',
    'andel_process': 'mean',
    'kul_TJ': 'sum',
    'fuelolie_TJ': 'sum',
    'spildolie_TJ': 'sum',
    'gasolie_TJ': 'sum',
    'raffinaderigas_TJ': 'sum',
    'lpg_TJ': 'sum',
    'naturgas_TJ': 'sum',
    'affald_TJ': 'sum',
    'biogas_TJ': 'sum',
    'halm_TJ': 'sum',
    'skovflis_TJ': 'sum',
    'trae- og biomasseaffald_TJ': 'sum',
    'traepiller_TJ': 'sum',
    'bio-olie_TJ': 'sum',
    'braendselsfrit_TJ': 'sum',
    'solenergi_TJ': 'sum',
    'vandkraft_TJ': 'sum',
    'elektricitet_TJ': 'sum',
    'omgivelsesvarme_TJ': 'sum',
    'lau_1': 'first'  # Add aggregation for lau_1
}

# Group by label_dk and year (aar), applying the specified aggregation functions
grouped_data = production_data.groupby(['label_dk', 'aar']).agg(aggregation_functions).reset_index()

# Remove the fv_net_navn column if it exists
if 'fv_net_navn' in grouped_data.columns:
    grouped_data.drop(columns=['fv_net_navn'], inplace=True)

# Rename label_dk to fv_net_navn
grouped_data.rename(columns={'label_dk': 'fv_net_navn', 'lau_1': 'forsyid'}, inplace=True)

# Reorder columns to match the specified order
column_order = [
    'fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 'DB07', 'NR117', 
    'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 'brutto_TJ', 'varmeprod_TJ', 
    'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 'andel_varmelev', 'andel_el', 'andel_process', 
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 
    'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ', 
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ', 'vandkraft_TJ', 
    'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id', 'vrkanl_ny', 'vaerk_navn', 
    'vaerk_postnr', 'vaerk_postdistrikt', 'fv_net', 'selskab_id', 'cvr', 'selskab_navn', 
    'vrktypeid', 'vrktypenavn', 'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 
    'skrotdato'
]
grouped_data = grouped_data[column_order]

# Save the aggregated data to a new CSV file as production_municipalities.csv
grouped_data.to_csv('data/production_municipalities.csv', index=False)

# Print the grouped data
print(grouped_data)

