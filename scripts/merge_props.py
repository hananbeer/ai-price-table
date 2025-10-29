import json
import csv

# Load model mapping from JSON
with open('bak/fal-schemas.json', 'r', encoding='utf-8') as f:
    schemas = json.load(f)

# Create a mapping from model_id (or name if that's the key) to their metadata
# Try to support both: if schemas is a dict with model names as keys, map directly, else try to find a field
if isinstance(schemas, dict):
    model_map = schemas
elif isinstance(schemas, list):
    model_map = {}
    for m in schemas:
        model_id = m.get('provider') + '/' + m.get('name')
        if model_id:
            model_map[model_id] = m
else:
    model_map = {}

# Open the input CSV and prepare to write output CSV with appended columns
input_csv = 'data/prices-v1.csv'
output_csv = 'data/prices-v1.with-props.csv'

with open(input_csv, 'r', encoding='utf-8') as fin:
    reader = csv.DictReader(fin)
    fieldnames = reader.fieldnames + ['description']
    rows = []
    for row in reader:
        model_id = row.get('model_id')
        props = model_map.get(model_id, {})
        # row['name'] = props.get('name', '')
        row['description'] = props.get('desc', '')
        rows.append(row)

with open(output_csv, 'w', encoding='utf-8', newline='') as fout:
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
