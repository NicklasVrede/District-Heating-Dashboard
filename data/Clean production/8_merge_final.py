import pandas as pd

file1 = "data/Clean production/filtered_final.csv"
file2 = "data/Clean production/production_remaining_with_forsyid.csv"

output_filepath = "data/Clean production/production_data.csv"

# Define data types for critical columns
dtypes = {
    'forsyid': str,
    'aar': int,
    'vaerk_kommune': str,
    'kvoteaktivitet': float,
    'DB07': float,
    'NR117': float,
    'indfyretkapacitet_MW': float,
    'elkapacitet_MW': float,
    'varmekapacitet_MW': float,
    'brutto_TJ': float,
    'varmeprod_TJ': float,
    'varmelev_TJ': float,
    'elprod_TJ': float,
    'ellev_TJ': float,
    'andel_varmelev': float,
    'andel_el': float,
    'andel_process': float
}

# Read CSVs with specified data types
df1 = pd.read_csv(file1, dtype=dtypes)
df2 = pd.read_csv(file2, dtype=dtypes)

df = pd.concat([df1, df2], ignore_index=True)

# Ensure forsyid is 8 digits before grouping
df['forsyid'] = df['forsyid'].fillna('0')
df['forsyid'] = df['forsyid'].astype(str).str.zfill(8)

df = df.groupby(['forsyid', 'aar']).agg({
    'fv_net_navn': lambda x: next((val for val in x if val not in [0, '0', '', None]), x.iloc[0]),
    'vaerk_kommune': 'first',
    'kvoteaktivitet': 'first',
    'DB07': 'first',
    'NR117': 'first',
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
    'vaerk_id': 'first',
    'vrkanl_ny': 'first',
    'vaerk_navn': 'first',
    'vaerk_postnr': 'first',
    'vaerk_postdistrikt': 'first',
    'fv_net': 'first',
    'selskab_id': 'first',
    'cvr': 'first',
    'selskab_navn': 'first',
    'vrktypeid': 'first',
    'vrktypenavn': 'first',
    'anlaeg_navn': 'first',
    'anlaegstype_navn': 'first',
    'aktoer': 'first',
    'idriftdato': 'min',
    'skrotdato': 'max'
}).reset_index()

# Define the exact column order
column_order = [
    'fv_net_navn', 'forsyid', 'aar', 'vaerk_kommune', 'kvoteaktivitet', 'DB07', 'NR117',
    'indfyretkapacitet_MW', 'elkapacitet_MW', 'varmekapacitet_MW', 'brutto_TJ', 'varmeprod_TJ',
    'varmelev_TJ', 'elprod_TJ', 'ellev_TJ', 'andel_varmelev', 'andel_el', 'andel_process',
    'kul_TJ', 'fuelolie_TJ', 'spildolie_TJ', 'gasolie_TJ', 'raffinaderigas_TJ', 'lpg_TJ',
    'naturgas_TJ', 'affald_TJ', 'biogas_TJ', 'halm_TJ', 'skovflis_TJ', 'trae- og biomasseaffald_TJ',
    'traepiller_TJ', 'bio-olie_TJ', 'braendselsfrit_TJ', 'solenergi_TJ', 'vandkraft_TJ',
    'elektricitet_TJ', 'omgivelsesvarme_TJ', 'vaerk_id', 'vrkanl_ny', 'vaerk_navn', 'vaerk_postnr',
    'vaerk_postdistrikt', 'fv_net', 'selskab_id', 'cvr', 'selskab_navn', 'vrktypeid', 'vrktypenavn',
    'anlaeg_navn', 'anlaegstype_navn', 'aktoer', 'idriftdato', 'skrotdato'
]

df = df[column_order]
df = df.sort_values(by=['forsyid', 'aar'])
df.to_csv(output_filepath, index=False)