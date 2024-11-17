import pandas as pd

def load_mappings():
    try:
        plants_df = pd.read_csv('data/plants.csv')
        mapping_df = pd.read_csv('data/data_names_mapping.csv')
        
        # Clean the data
        plants_df['name'] = plants_df['name'].str.strip()
        mapping_df['Unique Names in data'] = mapping_df['Unique Names in data'].str.strip()
        mapping_df['Names of plants'] = mapping_df['Names of plants'].str.strip()
        
        # Create mappings
        name_mapping = dict(zip(mapping_df['Unique Names in data'], mapping_df['Names of plants']))
        forsyid_mapping = dict(zip(plants_df['name'], plants_df['forsyid'].astype(int)))
        
        return name_mapping, forsyid_mapping
    except Exception as e:
        print(f"Error loading mappings: {e}")
        return {}, {}

# Load the production data
plant_df = pd.read_csv('data/Clean production/production_remaining.csv')

# Initialize forsyid column if it doesn't exist
if 'forsyid' not in plant_df.columns:
    plant_df['forsyid'] = None

# Load mappings
name_mapping, forsyid_mapping = load_mappings()

# Update forsyids
mapped_names = plant_df['fv_net_navn'].map(name_mapping)
plant_df['forsyid'] = mapped_names.map(forsyid_mapping)
plant_df['forsyid'] = plant_df['forsyid'].fillna(0).astype(int)
plant_df['forsyid'] = plant_df['forsyid'].apply(lambda x: f'{int(x):08d}')

# Sort by fv_net_navn
plant_df = plant_df.sort_values('fv_net_navn')

# Reorder columns to match filtered_final.csv
column_order = ['fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 'DB07', 'NR117', 
                'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 'brutto_TJ', 
                'varmeprod_TJ', 'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 'andel_varmelev', 
                'andel_el', 'andel_process', 'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 
                'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 'naturgas_TJ', 'affald_TJ', 
                'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ', 
                'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ', 
                'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id', 
                'vrkanl_ny', 'vaerk_navn', 'vaerk_postnr', 'vaerk_postdistrikt', 'fv_net', 
                'selskab_id', 'cvr', 'selskab_navn', 'vrktypeid', 'vrktypenavn', 
                'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 'skrotdato']

plant_df = plant_df[column_order]

# Print statistics
print(f"\nTotal production entries: {len(plant_df)}")
print(f"Entries with matched forsyids: {(plant_df['forsyid'] != '00000000').sum()}")

# Print unmatched entries
print("\nUnmatched entries:")
unmatched_mask = plant_df['forsyid'] == '00000000'
print(plant_df[unmatched_mask][['fv_net_navn']].drop_duplicates().to_string())

try:
    output_path = 'data/Clean production/production_remaining_with_forsyid.csv'
    plant_df.to_csv(output_path, index=False)
    print(f"\nFile successfully written to: {output_path}")
    print(f"File contains {len(plant_df)} rows and {len(plant_df.columns)} columns")
except Exception as e:
    print(f"\nError writing file: {e}")
