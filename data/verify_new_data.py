import pandas as pd

file_path = "data/production_data.csv"
file_path2 = "data/production_data_new.csv"

# Read both files
df_old = pd.read_csv(file_path)
df_new = pd.read_csv(file_path2)

# Get unique forsyids from both datasets
old_ids = set(df_old['forsyid'])
new_ids = set(df_new['forsyid'])

# Find missing ids
missing_in_new = old_ids - new_ids
missing_in_old = new_ids - old_ids

print(f"Number of unique forsyids in old data: {len(old_ids)}")
print(f"Number of unique forsyids in new data: {len(new_ids)}")

if missing_in_new:
    print(f"\nForsyids missing in new data ({len(missing_in_new)}):")
    print(sorted(missing_in_new))

if missing_in_old:
    print(f"\nNew forsyids not in old data ({len(missing_in_old)}):")
    print(sorted(missing_in_old))
