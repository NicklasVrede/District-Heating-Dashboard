file_path = 'data/Clean production/filtered_geolocated_updated.csv'
import pandas as pd

# Read the CSV file
df = pd.read_csv(file_path)

# Group by both forsyid and aar with different aggregation methods
grouped_df = df.groupby(['forsyid', 'aar']).agg({
    # Keep longest value for fv_net_navn
    'fv_net_navn': lambda x: max(x, key=len),
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
    
    # Keep earliest dates
    'idriftdato': 'min',
    'skrotdato': 'max',
    
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
    'omgivelsesvarme_TJ': 'sum'
}).reset_index()

# Convert forsyid to 8-digit string
grouped_df['forsyid'] = grouped_df['forsyid'].fillna(0).astype(int)
grouped_df['forsyid'] = grouped_df['forsyid'].apply(lambda x: f"{x:08d}")

# Define column order to match production data
column_order = [
    'fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 
    'DB07', 'NR117', 'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW',
    'brutto_TJ', 'varmeprod_TJ', 'varmelev_TJ', 'elprod_TJ', 'ellev_TJ',
    'andel_varmelev', 'andel_el', 'andel_process', 'kul_TJ', 'fuelolie_TJ',
    'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 'naturgas_TJ',
    'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ',
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ',
    'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id',
    'vrkanl_ny', 'vaerk_navn', 'vaerk_postnr', 'vaerk_postdistrikt', 'fv_net',
    'selskab_id', 'cvr', 'selskab_navn', 'vrktypeid', 'vrktypenavn',
    'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 'skrotdato'
]

# Save the grouped DataFrame to CSV with the specified column order
grouped_df.to_csv('data/Clean production/filtered_final.csv', index=False, columns=column_order)