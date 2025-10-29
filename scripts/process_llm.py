import csv
import os
import requests
import json
from typing import Optional
import dotenv
dotenv.load_dotenv()

# OpenRouter configuration for free LLM
LLM_API_KEY: Optional[str] = os.getenv('OPENROUTER_API_KEY')  # Set via environment variable
LLM_API_BASE: str = 'https://openrouter.ai/api/v1'
LLM_MODEL: str = 'microsoft/wizardlm-2-8x22b'  # Free model on OpenRouter

# TODO: Set your prompt template here
# {plain_text} will be replaced with the actual plain text from each row
PROMPT_TEMPLATE = """
here is a pricing formula in plain english.
please translate the pricing formula from plain english to proper arithmetic expression.

if there are conditions such as audio enabled, or various resolutions like 480p, 720p and so on, please output each formula like

resolution:480p = <formula>
resolution:720p = <formula>

if generation price is per image, just output the price.
if generation price is per video, just output the price.
if generation is per video second for example, output "seconds * <price>"
if generation is per X tokens, output "<price> / X", for example per 1M tokens the formula is "<price> / 1000000"

{plain_text}
"""

def query_llm(plain_text: str) -> str:
    """
    Query the LLM using OpenRouter API.
    """
    
    if not LLM_API_KEY:
        print("Error: OPENROUTER_API_KEY environment variable not set")
        return "Error: API key not configured"
    
    prompt = PROMPT_TEMPLATE.format(plain_text=plain_text)
    
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-repo",  # Optional: replace with your repo
        "X-Title": "AI Price Table Processor"  # Optional: replace with your app name
    }
    
    data = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.1
    }
    
    try:
        response = requests.post(
            f"{LLM_API_BASE}/chat/completions",
            headers=headers,
            data=json.dumps(data),
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling OpenRouter API: {e}")
        return f"Error: {str(e)}"
    except (KeyError, IndexError) as e:
        print(f"Error parsing OpenRouter response: {e}")
        return f"Error parsing response: {str(e)}"

def process_csv(input_file: str = 'fal-prices-plain.csv', output_file: Optional[str] = None):
    """
    Read CSV file and query LLM for each row's Plain Text column.
    
    Args:
        input_file: Path to input CSV file (default: 'fal-prices-plain.csv')
        output_file: Optional path to output CSV file with LLM responses
    """
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        return
    
    results = []
    
    with open(input_file, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        if 'Plain Text' not in reader.fieldnames:
            print(f"Error: 'Plain Text' column not found in CSV")
            print(f"Available columns: {reader.fieldnames}")
            return
        
        total_rows = sum(1 for _ in reader)
        csvfile.seek(0)  # Reset to beginning
        reader = csv.DictReader(csvfile)  # Recreate reader
        
        print(f"Processing {total_rows} rows from {input_file}...")
        
        for idx, row in enumerate(reader, start=1):
            model_id = row.get('Model ID', '')
            plain_text = row.get('Plain Text', '')
            
            if not plain_text.strip():
                print(f"Row {idx}: Skipping empty Plain Text")
                continue
            
            print(f"Processing row {idx}/{total_rows}: {model_id}")
            
            llm_response = query_llm(plain_text)
            
            result = {
                'Model ID': model_id,
                'Plain Text': plain_text,
                'LLM Response': llm_response
            }
            print(result)
            results.append(result)
    
    # Optionally write results to output file
    if output_file:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Model ID', 'Plain Text', 'LLM Response']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"\nResults written to {output_file}")
    
    return results

if __name__ == '__main__':
    print("AI Price Table Processor using OpenRouter")
    print("=" * 50)
    print("To use this script:")
    print("1. Get a free API key from https://openrouter.ai/")
    print("2. Set your API key: export OPENROUTER_API_KEY=your_key_here")
    print("3. Run: python process_llm.py")
    print("=" * 50)
    
    if not LLM_API_KEY:
        print("\nError: OPENROUTER_API_KEY environment variable not set!")
        print("Please set your API key and try again.")
        exit(1)
    
    # Process the CSV file
    # You can specify output file: process_csv('fal-prices-plain.csv', 'llm_responses.csv')
    csv_results = process_csv('fal-prices-plain.csv', 'llm_responses.csv')
    
    if csv_results:
        print(f"\nSuccessfully processed {len(csv_results)} rows!")
        print("Results saved to 'llm_responses.csv'")

