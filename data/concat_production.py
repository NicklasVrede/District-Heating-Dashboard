import pandas as pd

file1 = 'data/Clean production/production_remaining_with_forsyid.csv'
file2 = 'data/Clean production/filtered_final.csv'

# Read both CSV files
df1 = pd.read_csv(file1, dtype={'forsyid': str})
df2 = pd.read_csv(file2, dtype={'forsyid': str})

# Ensure column names match (if needed)
df2.columns = df2.columns.str.strip()
df1.columns = df1.columns.str.strip()

# Get columns from filtered_final.csv (df2)
columns_to_keep = df2.columns.tolist()

# Filter df1 to keep only the columns present in df2
df1 = df1[columns_to_keep]

# Simple concatenation without any grouping
combined_df = pd.concat([df1, df2], axis=0, ignore_index=True)

# Save the combined dataset without any deduplication
combined_df.to_csv('data/combined_production_data.csv', index=False)

# Print info and check for the specific forsyid
print("\nCombined DataFrame info:")
print(combined_df.info())
print("\nChecking for forsyid '00000009':")
print(combined_df[combined_df['forsyid'] == '00000009'])

