#convert the data\data_om_fv.xlsx to data\data_om_fv.csv
import pandas as pd

df = pd.read_excel('data\data_names_mapping.xlsx')
df.to_csv('data\data_names_mapping.csv', index=False)
print('data\data_names_mapping.csv created')