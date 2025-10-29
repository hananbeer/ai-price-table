import csv

# Read model-to-tag mapping from fal-tags2.csv
model_to_tag = {}
with open('fal-tags2.csv', newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 2:
            model_id, tag = row[0].strip(), row[1].strip()
            model_to_tag[model_id] = tag

# Read fal-prices-plain2.csv, append Tag column and write to new file
input_file = 'fal-prices-plain2.csv'
output_file = 'fal-prices-plain2.with-tags.csv'

with open(input_file, newline='', encoding='utf-8') as fin, \
     open(output_file, 'w', newline='', encoding='utf-8') as fout:
    reader = csv.DictReader(fin)
    fieldnames = reader.fieldnames + ['Tag']
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        model_id = row.get('Model ID')
        tag = model_to_tag.get(model_id, "")
        row['Tag'] = tag
        writer.writerow(row)

