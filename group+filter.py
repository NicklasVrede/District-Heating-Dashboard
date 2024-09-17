import pandas as pd

# load the data
data = pd.read_excel('Visualisering/UFM_samlet_06SEP2024.xlsx')

# List of columns to convert
cols_to_convert = [
    'afbrud', 'afbrud_n', 'ledighed_nyudd_n', 'ledighed_nyudd', 'maanedloen_nyudd_n', 'maanedloen_nyudd',
    'ledighed_10aar_n', 'ledighed_10aar', 'maanedloen_10aar_n', 'maanedloen_10aar', 'tidsforbrug_p50',
    'arbejdsform_skiftende_pct', 'arbejdsform_faste_aften_nat_pct', 'arbejdsform_fastedagtimer_pct',
    'arbejdstid_n', 'arbejdstid_timer'
]

# Replace commas with periods and convert to float
data['tidsforbrug_p50'] = data['tidsforbrug_p50'].str.replace(',', '.').astype(float)

# Now you can convert the rest of the columns to numeric
for col in cols_to_convert:
    if col != 'tidsforbrug_p50':  # We've already converted 'tidsforbrug_p50'
        data[col] = pd.to_numeric(data[col], errors='coerce')


grouped_data = data.groupby('Titel').agg({
    'afbrud': 'sum',
    'afbrud_n': 'sum',
    'ledighed_nyudd_n': 'sum',
    'ledighed_nyudd': 'sum',
    'maanedloen_nyudd_n': 'sum',
    'maanedloen_nyudd': 'mean',
    'ledighed_10aar_n': 'sum',
    'ledighed_10aar': 'sum',
    'maanedloen_10aar_n': 'sum',
    'maanedloen_10aar': 'mean',
    'tidsforbrug_p50': 'mean',
    'arbejdsform_skiftende_pct': 'mean',
    'arbejdsform_faste_aften_nat_pct': 'mean',
    'arbejdsform_fastedagtimer_pct': 'mean',
    'arbejdstid_n': 'mean',
    'arbejdstid_timer': 'mean',
}).reset_index()

#tilføj adgangskvotienter?
#Beregn sværhedsgrad?

#preview the data
print(grouped_data.head())

#save the grouped data to a new excel file
grouped_data.to_excel('Visualisering/UFM_samlet_06SEP2024_grouped.xlsx', index=False)