#!/usr/bin/env python3
"""
CSV to JSON Converter

A safe and robust script to convert CSV files to JSON format with proper error handling,
data validation, and flexible output options.

Usage:
    python csv_to_json.py input.csv [output.json] [options]

Options:
    --encoding ENCODING    Input file encoding (default: utf-8)
    --delimiter DELIMITER  CSV delimiter (default: ,)
    --quotechar QUOTECHAR  CSV quote character (default: ")
    --array               Output as JSON array (default: array of objects)
    --object              Output as single JSON object with row indices as keys
    --pretty              Pretty print JSON output
    --validate            Validate JSON output before writing
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any, Union, Optional


class CSVToJSONConverter:
    """Safe CSV to JSON converter with validation and error handling."""
    
    def __init__(self, encoding: str = 'utf-8', delimiter: str = ',', 
                 quotechar: str = '"'):
        self.encoding = encoding
        self.delimiter = delimiter
        self.quotechar = quotechar
        
    def clean_value(self, value: str) -> Union[str, int, float, None]:
        """Clean and convert CSV values to appropriate JSON types."""
        if not value:
            return None
            
        value = value.strip()
        
        # Try to convert to number if it looks like one
        if value.replace('.', '').replace('-', '').isdigit():
            if '.' in value:
                try:
                    return float(value)
                except ValueError:
                    pass
            else:
                try:
                    return int(value)
                except ValueError:
                    pass
        
        # Try to convert boolean strings
        if value.lower() in ('true', 'false'):
            return value.lower() == 'true'
        
        # Try to convert null/empty strings
        if value.lower() in ('null', 'none', ''):
            return None
            
        return value
    
    def read_csv(self, file_path: Path) -> tuple[List[str], List[List[str]]]:
        """Read CSV file and return headers and data rows."""
        if not file_path.exists():
            raise FileNotFoundError(f"Input file not found: {file_path}")
        
        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")
        
        try:
            with open(file_path, 'r', encoding=self.encoding, newline='') as csvfile:
                # Use the specified delimiter directly
                
                reader = csv.reader(csvfile, delimiter=self.delimiter, quotechar=self.quotechar)
                
                # Read all rows
                rows = list(reader)
                if not rows:
                    raise ValueError("CSV file is empty")
                
                # Always treat first row as headers
                headers = rows[0]
                data_rows = rows[1:]
                
                return headers, data_rows
                
        except UnicodeDecodeError as e:
            raise ValueError(f"Encoding error: {e}. Try specifying --encoding parameter.") from e
        except csv.Error as e:
            raise ValueError(f"CSV parsing error: {e}") from e
        except Exception as e:
            raise ValueError(f"Error reading file: {e}") from e
    
    def convert_to_objects(self, headers: List[str], data_rows: List[List[str]]) -> List[Dict[str, Any]]:
        """Convert CSV data to array of objects."""
        result = []
        
        for row in data_rows:
            obj = {}
            for col_idx, header in enumerate(headers):
                value = self.clean_value(row[col_idx]) if col_idx < len(row) else None
                obj[header] = value
            result.append(obj)
        
        return result
    
    def convert_to_object(self, headers: List[str], data_rows: List[List[str]]) -> Dict[str, Any]:
        """Convert CSV data to single object with row indices as keys."""
        result = {}
        
        for row_idx, row in enumerate(data_rows):
            row_obj = {}
            for col_idx, header in enumerate(headers):
                value = self.clean_value(row[col_idx]) if col_idx < len(row) else None
                row_obj[header] = value
            result[str(row_idx)] = row_obj
        
        return result
    
    def convert_to_array(self, headers: List[str], data_rows: List[List[str]]) -> List[List[Any]]:
        """Convert CSV data to array of arrays."""
        result = []
        
        for row in data_rows:
            cleaned_row = []
            for col_idx in range(len(headers)):
                value = self.clean_value(row[col_idx]) if col_idx < len(row) else None
                cleaned_row.append(value)
            result.append(cleaned_row)
        
        return result
    
    def validate_json(self, data: Any) -> bool:
        """Validate that data can be serialized to JSON."""
        try:
            json.dumps(data)
            return True
        except (TypeError, ValueError) as e:
            print(f"JSON validation error: {e}")
            return False
    
    def convert(self, input_path: Path, output_path: Optional[Path] = None, 
                output_format: str = 'objects', pretty: bool = False, 
                validate: bool = False) -> Path:
        """Convert CSV to JSON with specified options."""
        
        # Read CSV data
        headers, data_rows = self.read_csv(input_path)
        
        print(f"Read {len(data_rows)} data rows with {len(headers)} columns")
        print(f"Headers: {headers}")
        
        # Convert based on format
        if output_format == 'objects':
            json_data = self.convert_to_objects(headers, data_rows)
        elif output_format == 'object':
            json_data = self.convert_to_object(headers, data_rows)
        elif output_format == 'array':
            json_data = self.convert_to_array(headers, data_rows)
        else:
            raise ValueError(f"Unknown output format: {output_format}")
        
        # Validate if requested
        if validate and not self.validate_json(json_data):
            raise ValueError("JSON validation failed")
        
        # Determine output path
        if output_path is None:
            output_path = input_path.with_suffix('.json')
        
        # Write JSON file
        try:
            with open(output_path, 'w', encoding='utf-8') as jsonfile:
                if pretty:
                    json.dump(json_data, jsonfile, indent=2, ensure_ascii=False)
                else:
                    json.dump(json_data, jsonfile, ensure_ascii=False)
            
            print(f"Successfully converted to: {output_path}")
            return output_path
            
        except Exception as e:
            raise ValueError(f"Error writing JSON file: {e}") from e


def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(
        description="Safely convert CSV files to JSON format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument('input', help='Input CSV file path')
    parser.add_argument('output', nargs='?', help='Output JSON file path (optional)')
    parser.add_argument('--encoding', default='utf-8', help='Input file encoding (default: utf-8)')
    parser.add_argument('--delimiter', default=',', help='CSV delimiter (default: ,)')
    parser.add_argument('--quotechar', default='"', help='CSV quote character (default: ")')
    parser.add_argument('--format', choices=['objects', 'object', 'array'], 
                       default='objects', help='Output format (default: objects)')
    parser.add_argument('--pretty', action='store_true', help='Pretty print JSON output')
    parser.add_argument('--validate', action='store_true', help='Validate JSON output before writing')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    output_path = Path(args.output) if args.output else None
    
    try:
        # Create converter and convert
        converter = CSVToJSONConverter(
            encoding=args.encoding,
            delimiter=args.delimiter,
            quotechar=args.quotechar
        )
        
        result_path = converter.convert(
            input_path=input_path,
            output_path=output_path,
            output_format=args.format,
            pretty=args.pretty,
            validate=args.validate
        )
        
        print("Conversion completed successfully!")
        print(f"Output file: {result_path}")
        
    except (ValueError, FileNotFoundError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
