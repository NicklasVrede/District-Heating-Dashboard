import pandas as pd

file_path = 'data/Clean production/filtered_ids.csv'

# Define the desired column order
column_order = [
    'fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 'DB07', 'NR117',
    'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 'brutto_TJ',
    'varmeprod_TJ', 'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 'andel_varmelev',
    'andel_el', 'andel_process', 'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ',
    'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ', 'naturgas_TJ', 'affald_TJ',
    'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ',
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ',
    'vandkraft_TJ', 'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id',
    'vrkanl_ny', 'vaerk_navn', 'vaerk_postnr', 'vaerk_postdistrikt', 'fv_net',
    'selskab_id', 'cvr', 'selskab_navn', 'vrktypeid', 'vrktypenavn',
    'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 'skrotdato', 'plant_name'
]

# Read the CSV file
df = pd.read_csv(file_path)

# Group by forsyid and aar, then aggregate
# Sum numeric columns and take first value for string columns
aggregated_df = df.groupby(['forsyid', 'aar']).agg(lambda x: x.sum() if x.dtype.kind in 'biufc' else x.iloc[0])

# Ensure forsyid is 8 digits
aggregated_df.reset_index(inplace=True)
aggregated_df['forsyid'] = aggregated_df['forsyid'].astype(str).str.zfill(8)

# Reorder columns (excluding forsyid and aar since they will be in the index)
available_columns = [col for col in column_order if col in aggregated_df.columns and col not in ['forsyid', 'aar']]
aggregated_df = aggregated_df[['forsyid', 'aar'] + available_columns]

# Set the index after reordering
aggregated_df.set_index(['forsyid', 'aar'], inplace=True)

# Save to new file
output_path = file_path.replace('.csv', '_merged.csv')
aggregated_df.to_csv(output_path, index=True)