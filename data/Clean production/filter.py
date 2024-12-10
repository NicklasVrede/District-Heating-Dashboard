import pandas as pd

# Read the production data
production_df = pd.read_csv('data/Clean production/production_no_merge.csv')

# Define networks to filter
EXCLUDE_FROM_NET_MERGE = ['Hadsund By Fjernvarme', 
                         'Sindal Fjernvarme (inkl. Bindslev fra 2021)', 
                         'Århus Fjernvarme',
                         'TVIS',
                         'Nordøstsjællands Fjernvarme',
                         'Fjernvarme Fyn',
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
                         'Hillerød-Farum-Værløse',
                         'Herning-Ikast Fjernvarme']

def get_longest_valid_name(x):
    # Convert to string and filter out '0' and empty strings
    valid_names = [str(name) for name in x if str(name) not in ['0', 'nan', '']]
    # Return longest valid name if exists, otherwise return first value
    return max(valid_names, key=len) if valid_names else x.iloc[0]

# Filter and group
filtered_df = (production_df[production_df['fv_net_navn'].isin(EXCLUDE_FROM_NET_MERGE)]
              .groupby(['vaerk_navn', 'aar', 'vaerk_postdistrikt'])
              .agg({
                  # Keep longest valid value for network name
                  'fv_net_navn': get_longest_valid_name,
                  
                  # Keep first value for categorical/text columns
                  'vaerk_id': 'first',
                  'vrkanl_ny': 'first',
                  'vaerk_postnr': 'first',
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
              })
              .reset_index())

# Additional filtering for postal district
filtered_df = filtered_df[filtered_df['vaerk_postdistrikt'].notna()]

# Sort by network name and year
filtered_df = filtered_df.sort_values(['fv_net_navn', 'aar'])

# Save the filtered data
filtered_df.to_csv('data/Clean production/production_filtered.csv', index=False)

# Print summary
print(f"Total entries: {len(production_df)}")
print(f"Filtered entries: {len(filtered_df)}")

