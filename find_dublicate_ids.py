import pandas as pd

# Load the data from the CSV file
data_df = pd.read_csv('data/data_om_fv_with_ids.csv')

# Count the occurrences of each 'forsyid'
forsyid_counts = data_df['forsyid'].value_counts()

# Find 'forsyid' values that have more than 3 entries
forsyid_more_than_3 = forsyid_counts[forsyid_counts > 3].index

# Print the 'forsyid' values that have more than 3 entries
print("forsyid values with more than 3 entries:")
print(forsyid_more_than_3)