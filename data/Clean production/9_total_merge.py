import pandas as pd

file1 = "data/Clean production/production_data.csv"
file2 = "data/production_municipalities.csv"
output_filepath = "data/production_data_with_forsyid.csv"

# Read the CSV files
df1 = pd.read_csv(file1)
df2 = pd.read_csv(file2)

# Merge the dataframes
# Note: You might need to specify the merge column(s) using 'on' parameter
merged_df = pd.merge(df1, df2, how='left')

# Save the merged dataframe to CSV
merged_df.to_csv(output_filepath, index=False)
print(f"Merged file saved to: {output_filepath}")


