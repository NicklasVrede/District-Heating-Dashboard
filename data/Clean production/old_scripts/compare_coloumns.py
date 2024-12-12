filepath = "data/Clean production/2000-2020.csv"
filepath2 = "data/Clean production/production_no_merge.csv"

import pandas as pd

# Read both CSV files
df1 = pd.read_csv(filepath)
df2 = pd.read_csv(filepath2)

# Get column names from both dataframes
columns1 = set(df1.columns)
columns2 = set(df2.columns)

# Find common columns
common_columns = columns1.intersection(columns2)

# Find columns unique to each file
only_in_file1 = columns1 - columns2
only_in_file2 = columns2 - columns1

print("Common columns in both files:")
print(sorted(common_columns))
print("\nColumns only in first file:")
print(sorted(only_in_file1))
print("\nColumns only in second file:")
print(sorted(only_in_file2))


