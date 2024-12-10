import pandas as pd

# Read the CSV file
df = pd.read_csv('data/Clean Production/production_no_merge.csv')

# Group by 'aar' and 'cvr', handling all columns
grouped_df = df.groupby(['aar', 'cvr']).agg({
    # Keep first value for categorical/identifier columns
    'vaerk_id': 'first',
    'vrkanl_ny': 'first',
    'vaerk_navn': 'first',
    'vaerk_postnr': 'first',
    'vaerk_postdistrikt': 'first',
    'vaerk_kommune': 'first',
    'fv_net': 'first',
    'fv_net_navn': 'first',
    'selskab_id': 'first',
    'selskab_navn': 'first',
    'kvoteaktivitet': 'first',
    'vrktypeid': 'first',
    'vrktypenavn': 'first',
    'anlaeg_navn': 'first',
    'anlaegstype_navn': 'first',
    'DB07': 'first',
    'NR117': 'first',
    'aktoer': 'first',
    'idriftdato': 'first',
    'skrotdato': 'first',
    
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

# Save the grouped data to a new CSV file
grouped_df.to_csv('data/Clean Production/grouped_cvr.csv', index=False)
