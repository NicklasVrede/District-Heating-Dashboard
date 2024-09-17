import pandas as pd

def frafald_procent(afbrud, afbrud_n):
    return afbrud/afbrud_n

# load the data
grouped_data = pd.read_excel('Visualisering/UFM_samlet_06SEP2024_grouped.xlsx')


#print top 5 uddannelser med højest frafaldsprocent
print(grouped_data.nlargest(5, 'afbrud'))

#print top 5 uddannelser med højest skiftende arbejdsform
print(grouped_data.nlargest(5, 'arbejdsform_skiftende_pct'))