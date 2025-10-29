import csv
import re

def determine_unit(text):
    """Determine unit based on Plain Text content"""
    if not text:
        return "unit"
    
    text_lower = text.lower()
    
    # Check for " second" string (with space before)
    if " second" in text_lower:
        return "Seconds"
    
    # Check for regex pattern "\ds " (digit followed by 's' and space)
    if re.search(r'\ds ', text):
        return "Seconds"
    
    # Check for "megapixel"
    if "megapixel" in text_lower:
        return "megapixel"
    
    # Check for "token"
    if "token" in text_lower:
        return "token"
    
    # Check for "minute"
    if "minute" in text_lower:
        return "minute"
    
    # Default
    return "unit"

# Read the CSV file
input_file = 'fal-prices-plain2.csv'
output_file = 'fal-prices-plain2.csv'  # Overwrite the same file

rows = []
with open(input_file, 'r', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    
    # Check if first row is header
    first_row = next(reader, None)
    if first_row is None:
        print("File is empty")
        exit(1)
    
    # Check if first row looks like a header
    has_header = (len(first_row) == 2 and 
                  first_row[0].lower() == 'model id' and 
                  first_row[1].lower() == 'plain text')
    
    if has_header:
        # Save header and update it
        header = ['Model ID', 'Plain Text', 'Units']
        rows.append(header)
    else:
        # No header, add one and process first row as data
        rows.append(['Model ID', 'Plain Text', 'Units'])
        model_id = first_row[0] if len(first_row) > 0 else ""
        plain_text = first_row[1] if len(first_row) > 1 else ""
        unit = determine_unit(plain_text)
        rows.append([model_id, plain_text, unit])
    
    # Process remaining rows
    for row in reader:
        if len(row) < 2:
            continue
        model_id = row[0]
        plain_text = row[1]
        unit = determine_unit(plain_text)
        rows.append([model_id, plain_text, unit])

# Write the updated CSV
with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(rows)

print(f"Processed {len(rows) - 1} rows (excluding header)")
print(f"Added 'Units' column to {output_file}")

