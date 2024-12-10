import pandas as pd

# Read the production data
file_path = 'data/Clean production/production_remaining.csv'
df = pd.read_csv(file_path)

#Exclude by fv_net_navn:
exlude_list = ['Hadsund By Fjernvarme', 
                        'Sindal Fjernvarme (inkl. Bindslev fra 2021)', 
                        'Århus Fjernvarme',
                        'TVIS',
                        'Nordøstsjællands Fjernvarme',
                        'Fjernvarme Fyn',
                        'Nordøstsjællands Fjernvarme',
                        'Hørby Fjernvarme',
                        'Holstebro-Struer Fjernvarme',
                        'Hammel Fjernvarme',
                        'Esbjerg-Varde Fjernvarme',
                        '"DTU-Holte-Nærum Fjernvarme',
                        'Aalborg Fjernvarme',
                        '0',
                        'Storkøbenhavns Fjernvarme',
                        'Løkken Fjernvarme',
                        'Hjørring Fjernvarme (inkl. Hirtshals Fjernvarme fra 2011)',
                        'Vester Hjermitslev Fjernvarme',
                        'Aabenrå - Rødekro - Hjordkær Fjernvarme',
                        'Hillerød-Farum-Værløse']

# Group by both fv_net_navn and aar
grouped_df = df.groupby(['fv_net_navn', 'aar']).agg({
    # Keep first value for categorical/text columns
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

# Save the grouped data
output_path = 'data/Clean production/production_remaining_merged.csv'
grouped_df.to_csv(output_path, index=False)

# Print summary
print(f"Original entries: {len(df)}")
print(f"Grouped entries: {len(grouped_df)}")
print(f"\nGroups created: {len(grouped_df)} unique networks")