import pandas as pd

file1 = "data/Clean production/production_data.csv"
file2 = "data/production_municipalities.csv"
output_filepath = "data/production_data_with_forsyid.csv"

# Read the CSV files
df1 = pd.read_csv(file1)
df2 = pd.read_csv(file2)

# Print info about the dataframes
print(f"Production data shape: {df1.shape}")
print(f"Municipality data shape: {df2.shape}")

# Combine all entries using concat
combined_df = pd.concat([df1, df2], ignore_index=True)

# Remove any duplicates if they exist
combined_df = combined_df.drop_duplicates()

# Convert fv_net to integer, replacing any empty or NaN values with 0
combined_df['fv_net'] = pd.to_numeric(combined_df['fv_net'], errors='coerce').fillna(0).astype(int)

# Ensure forsyid is 8 digits by converting to string and padding with zeros
combined_df['forsyid'] = combined_df['forsyid'].astype(str).str.zfill(8)

# Reorder columns - first three columns as specified
first_columns = ['forsyid', 'fv_net', 'fv_net_navn']
other_columns = [col for col in combined_df.columns if col not in first_columns]
combined_df = combined_df[first_columns + other_columns]

print(f"\nFinal combined shape: {combined_df.shape}")

# Save the combined dataframe to CSV
combined_df.to_csv(output_filepath, index=False)
print(f"\nCombined file saved to: {output_filepath}")


