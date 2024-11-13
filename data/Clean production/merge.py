import pandas as pd
import csv

# Set display options
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', None)

# Load the production data
production_df = pd.read_excel('data/production.xlsx')

# Convert numeric columns to numeric type
numeric_columns = [col for col in production_df.columns 
                  if production_df[col].dtype in ['int64', 'float64'] 
                  and col not in ['aar', 'vaerk_kommune']]

production_df[numeric_columns] = production_df[numeric_columns].apply(pd.to_numeric, errors='coerce')

# Clean names
def clean_name(name):
    if pd.isna(name):
        return ""
    return str(name).replace('"', '').replace(',', '').strip()

production_df['vaerk_navn'] = production_df['vaerk_navn'].apply(clean_name)
production_df['fv_net_navn'] = production_df['fv_net_navn'].apply(clean_name)

# Only filter zero varmelev_TJ
production_df = production_df[production_df['varmelev_TJ'] != 0]

# Split into two dataframes based on network name
EXCLUDE_FROM_NET_MERGE = ['Storkøbenhavns Fjernvarme']
merge_by_net_df = production_df[~production_df['fv_net_navn'].isin(EXCLUDE_FROM_NET_MERGE)]
merge_by_name_df = production_df[production_df['fv_net_navn'].isin(EXCLUDE_FROM_NET_MERGE)]

# First, create a DataFrame with the oldest idriftdato for each fv_net_navn
oldest_dates = production_df.groupby('fv_net_navn')['idriftdato'].min().reset_index()
oldest_dates.columns = ['fv_net_navn', 'idriftdato']

# For Storkøbenhavn, get oldest dates by vaerk_navn instead
storkobenhavn_dates = production_df[production_df['fv_net_navn'].isin(EXCLUDE_FROM_NET_MERGE)]\
    .groupby('vaerk_navn')['idriftdato'].min().reset_index()
storkobenhavn_dates.columns = ['vaerk_navn', 'idriftdato']

# Group by fv_net_navn and year for regular networks
net_groups = merge_by_net_df.groupby(['fv_net_navn', 'aar']).agg({
    'vaerk_navn': 'first',
    'vaerk_kommune': 'first',
    'vrktypenavn': 'first',
    **{col: 'sum' for col in numeric_columns}
}).reset_index()

net_groups['match_type'] = 'net'

# Group by vaerk_navn and year for Storkøbenhavn
name_groups = merge_by_name_df.groupby(['vaerk_navn', 'aar']).agg({
    'fv_net_navn': 'first',
    'vaerk_kommune': 'first',
    'vrktypenavn': 'first',
    **{col: 'sum' for col in numeric_columns}
}).reset_index()
name_groups['match_type'] = 'name'

# Combine the groups
result_df = pd.concat([net_groups, name_groups], ignore_index=True)
result_df = result_df.sort_values(['aar', 'fv_net_navn'])

# Now merge the oldest dates back in
result_df = pd.merge(
    result_df,
    oldest_dates,
    on='fv_net_navn',
    how='left'
)

# For Storkøbenhavn entries, update with dates from vaerk_navn
storkobenhavn_mask = result_df['match_type'] == 'name'
result_df.loc[storkobenhavn_mask, 'idriftdato'] = result_df.loc[storkobenhavn_mask]\
    .merge(storkobenhavn_dates, on='vaerk_navn', how='left')['idriftdato_y']

# Debug prints
print("\nSample of result_df with idriftdato:")
print(result_df[['fv_net_navn', 'aar', 'idriftdato']].head())

# Save to CSV
result_df.to_csv('data/merged_production_final.csv', 
                 index=False, 
                 encoding='utf-8',
                 quoting=csv.QUOTE_MINIMAL,
                 quotechar="'",
                 escapechar='\\')


# Find all Esbjerg-Varde entries
esbjerg_entries = production_df[production_df['fv_net_navn'] == 'Esbjerg-Varde Fjernvarme']


