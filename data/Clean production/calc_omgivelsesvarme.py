filepath = "data/Clean production/2000-2020.csv"
output_filepath = "data/Clean production/2000-2020_cleaned.csv"
coloumn = "omgivelsesvarme_TJ"

import pandas as pd

# Read the CSV file
df = pd.read_csv(filepath)

# Replace all NaN/missing values with 0 across all columns
df = df.fillna(0)

# Calculate omgivelsesvarme_TJ for specific anlaegstype_navn
anlaegstype_filter = df['anlaegstype_navn'].isin([
    'Varmepumpe', 
    'Varmepumpe Anden', 
    'Varmepumpe Grundvand', 
    'Varmepumpe Luft', 
    'Varmepumpe Spildevand'
])
df.loc[anlaegstype_filter, coloumn] = df['varmeprod_TJ'] - df['brutto_TJ']

# Remove specified columns
columns_to_remove = ['orimulsion_TJ', 'petrokoks_TJ']
df = df.drop(columns=columns_to_remove)

# Save the modified DataFrame to a new CSV file
df.to_csv(output_filepath, index=False)