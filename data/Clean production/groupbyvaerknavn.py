import pandas as pd

# Read the production data
file_path = 'data/Clean production/production_filtered.csv'
production_df = pd.read_csv(file_path)

# Print all columns in the original DataFrame
print("\nColumns in the DataFrame:")
for col in production_df.columns:
    print(f"'{col}': Type: {production_df[col].dtype}")

# Merge rows and sort by vaerk_navn
grouped_df = (production_df.groupby(['vaerk_navn', 'aar'])
             .agg({
                 # Keep longest value for fv_net_navn
                 'fv_net_navn': lambda x: max(x, key=len),
                 'vaerk_postnr': 'first',
                 'vaerk_postdistrikt': 'first',
                 'vaerk_id': lambda x: ';'.join(sorted(set(str(i) for i in x))),
                 'vrkanl_ny': lambda x: ';'.join(sorted(set(str(i) for i in x))),
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
                 'skrotdato': 'max',  # Keep latest scrap date
                 
                 # Sum all capacity and production values
                 'indfyretkapacitet_MW': 'sum',
                 'elkapacitet_MW': 'sum',
                 'varmekapacitet_MW': 'sum',
                 'brutto_TJ': 'sum',
                 'varmeprod_TJ': 'sum',
                 'varmelev_TJ': 'sum',
                 'elprod_TJ': 'sum',
                 'ellev_TJ': 'sum',
                 
                 # Take weighted average of shares
                 'andel_varmelev': 'mean',
                 'andel_el': 'mean',
                 'andel_process': 'mean',
                 
                 # Sum all energy source values
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

# Reorder and save first grouping
first_cols = ['fv_net_navn', 'vaerk_postnr', 'vaerk_postdistrikt']
other_cols = [col for col in grouped_df.columns if col not in first_cols]
cols = first_cols + other_cols
grouped_df = grouped_df[cols]
grouped_df = grouped_df.sort_values(['fv_net_navn', 'vaerk_navn'])

# Save the first grouped data
output_path = 'data/Clean production/production_grouped_by_vaerk.csv'
grouped_df.to_csv(output_path, index=False)

# Second grouping by vaerk_postdistrikt and aar
district_grouped_df = (grouped_df.groupby(['vaerk_postdistrikt', 'aar'])
                      .agg({
                          # Keep first value for categorical/text columns
                          'vaerk_postnr': 'first',
                          'fv_net': 'first',
                          'fv_net_navn': 'first',
                          'vaerk_kommune': 'first',
                          
                          # Sum numeric values
                          'indfyretkapacitet_MW': 'sum',
                          'elkapacitet_MW': 'sum',
                          'varmekapacitet_MW': 'sum',
                          'brutto_TJ': 'sum',
                          'varmeprod_TJ': 'sum',
                          'varmelev_TJ': 'sum',
                          'elprod_TJ': 'sum',
                          'ellev_TJ': 'sum',
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

# Reorder columns for district grouping
first_cols = ['fv_net_navn', 'vaerk_postnr', 'vaerk_postdistrikt']
other_cols = [col for col in district_grouped_df.columns if col not in first_cols]
cols = first_cols + other_cols
district_grouped_df = district_grouped_df[cols]
district_grouped_df = district_grouped_df.sort_values(['fv_net_navn', 'vaerk_postdistrikt'])

# Save the district grouped data
output_path = 'data/Clean production/production_grouped_by_district.csv'
district_grouped_df.to_csv(output_path, index=False)

# Print summary
print(f"\nOriginal entries: {len(production_df)}")
print(f"First grouping entries: {len(grouped_df)}")
print(f"District grouping entries: {len(district_grouped_df)}")
print(f"\nUnique plants: {grouped_df.groupby(['vaerk_navn']).ngroups}")
print(f"Unique districts: {district_grouped_df.groupby(['vaerk_postdistrikt']).ngroups}")