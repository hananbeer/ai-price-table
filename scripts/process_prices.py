import json
import re
import csv
from html.parser import HTMLParser

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        
    def handle_data(self, data):
        self.text.append(data.strip())
    
    def get_text(self):
        return ' '.join(self.text).strip()

def strip_html(html_string):
    """Extract plain text from HTML string"""
    stripper = HTMLStripper()
    stripper.feed(html_string)
    return stripper.get_text()

def extract_price(text):
    """Extract price value from text"""
    # Look for $X.XX patterns
    price_match = re.search(r'\$([\d.]+)', text)
    if price_match:
        return float(price_match.group(1))
    return None

def create_inference_formula(text):
    """Create inference formula from pricing description"""
    text_lower = text.lower()
    
    # Remove HTML entities and normalize
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    
    # Extract all price values - improved regex to capture more decimal places
    # This pattern captures: $0.001, $0.00125, $1.2345, etc.
    prices = re.findall(r'\$(\d+\.\d+)', text)
    
    if not prices:
        return ""
    
    # Handle resolution-based pricing (480p, 720p, 1080p) - check this early
    if '480p' in text_lower and ('720p' in text_lower or '1080p' in text_lower):
        # Extract prices associated with resolutions
        # Pattern: "$X.YY for 480p" or "480p - $X.YY" or "for 480p , $X.YY"
        price_patterns = []
        resolutions = ['480p', '720p', '1080p']
        
        # First, try to find all resolution-price pairs in one go
        for resolution in resolutions:
            if resolution not in text_lower:
                continue
            
            # Try pattern: "480p - $0.10" (most specific)
            dash_match = re.search(rf'{resolution}\s*-\s*\$([\d.]+)', text_lower)
            if dash_match:
                price_patterns.append((resolution, dash_match.group(1)))
                continue
            
            # Try pattern: "$0.10 for 480p" or "$0.10 per second for 480p"
            before_match = re.search(rf'\$([\d.]+)[^$]*?{resolution}', text_lower)
            if before_match:
                # Make sure this price isn't already used by a previous resolution
                price = before_match.group(1)
                # Check if this price is closer to this resolution than others
                price_pos = text_lower.find(f'${price}')
                res_pos = text_lower.find(resolution)
                if price_pos < res_pos:  # Price comes before resolution
                    # Check if there's a closer resolution before this one
                    found_closer = False
                    for other_res in resolutions:
                        if other_res != resolution and other_res in text_lower:
                            other_pos = text_lower.find(other_res)
                            if price_pos < other_pos < res_pos:
                                found_closer = True
                                break
                    if not found_closer:
                        price_patterns.append((resolution, price))
                        continue
            
            # Try pattern: "480p $0.10" or "480p resolution and $0.10"
            # Limit search to avoid matching prices after "for $X" patterns
            after_match = re.search(rf'{resolution}[^$]*?\$([\d.]+)(?!\s*(?:you|you can|per|times|minutes?|seconds?|for))', text_lower)
            if after_match:
                price_patterns.append((resolution, after_match.group(1)))
            else:
                # Try pattern: "480p resolution and 0.4$" (dollar sign after number)
                after_match2 = re.search(rf'{resolution}[^$]*?([\d.]+)\$(?!\s*(?:you|you can|per|times|minutes?|seconds?|for))', text_lower)
                if after_match2:
                    price_patterns.append((resolution, after_match2.group(1)))
        
        if len(price_patterns) >= 2:
            # Build multi-line format for resolutions
            unit = 'second' if 'per second' in text_lower else 'video' if 'per video' in text_lower else 'unit'
            lines = []
            for res, price in price_patterns:
                lines.append(f"{res}: {unit} * {price}")
            return '\n'.join(lines)
    
    # Handle "for 5s video" patterns with additional seconds
    duration_match = re.search(r'for\s+(\d+)s?\s+video.*?cost\s+\$([\d.]+)', text_lower)
    if duration_match:
        duration = duration_match.group(1)
        base_price = duration_match.group(2)
        
        # Check for additional seconds pricing
        additional_match = re.search(r'additional.*?\$([\d.]+)', text_lower)
        if additional_match:
            additional_price = additional_match.group(1)
            return f"duration <= {duration} ? {base_price} : {base_price} + ((duration - {duration}) * {additional_price})"
        else:
            # Calculate per-second rate
            per_second = float(base_price) / float(duration)
            return f"duration * {per_second:.3f}"
    
    # Handle audio on/off variants
    if 'audio off' in text_lower and 'audio on' in text_lower:
        # Find prices in order: audio off first, then audio on
        # Match pattern like "$0.10 (audio off)" or "audio off) or $0.15"
        audio_off_match = re.search(r'\$([\d.]+)[^$]*?\(audio off\)', text_lower)
        if not audio_off_match:
            audio_off_match = re.search(r'audio off[^$]*?\$([\d.]+)', text_lower)
        
        audio_on_match = re.search(r'\$([\d.]+)[^$]*?\(audio on\)', text_lower)
        if not audio_on_match:
            audio_on_match = re.search(r'audio on[^$]*?\$([\d.]+)', text_lower)
        
        if audio_off_match and audio_on_match:
            return f"with audio: second * {audio_on_match.group(1)}\nno audio: second * {audio_off_match.group(1)}"
    
    # Handle step-based pricing
    if 'per step' in text_lower or 'per.*step' in text_lower:
        step_match = re.search(r'\$([\d.]+)\s+per.*?step', text_lower)
        if step_match:
            return f"step * {step_match.group(1)}"
        if prices:
            return f"step * {prices[0]}"
    
    # Handle per 1000-step training run
    if '1000-step' in text_lower and 'training run' in text_lower:
        match = re.search(r'\$([\d.]+).*?1000-step', text_lower)
        if match:
            price_per_1000 = match.group(1)
            return f"(step / 1000) * {price_per_1000}"
    
    # Pattern matching for different unit types - more specific first
    if 'compute second' in text_lower:
        return f"computeSecond * {prices[0]}"
    
    if 'video second' in text_lower:
        return f"videoSecond * {prices[0]}"
    
    if 'audio second' in text_lower:
        return f"audioSecond * {prices[0]}"
    
    if 'per image' in text_lower or 'per generation' in text_lower:
        # Check for vector style pricing
        if 'vector style' in text_lower and len(prices) >= 2:
            return f"vector style: image * {prices[1]}\nstandard: image * {prices[0]}"
        return f"image * {prices[0]}"
    
    if 'per video' in text_lower:
        return f"video * {prices[0]}"
    
    if 'per megapixel' in text_lower:
        return f"megapixel * {prices[0]}"
    
    if 'per second' in text_lower:
        return f"second * {prices[0]}"
    
    if 'per minute' in text_lower:
        return f"minute * {prices[0]}"
    
    if 'per 1000 character' in text_lower or 'per 1000 characters' in text_lower:
        return f"(character / 1000) * {prices[0]}"
    
    if 'per character' in text_lower:
        return f"character * {prices[0]}"
    
    if 'per training run' in text_lower:
        return f"trainingRun * {prices[0]}"
    
    # Check for video-related contexts
    if 'video' in text_lower and 'cost' in text_lower:
        return f"video * {prices[0]}"
    
    # Check for image-related contexts
    if ('image' in text_lower or 'generation' in text_lower) and 'cost' in text_lower:
        return f"image * {prices[0]}"
    
    # Handle "for $X you can run/generate Y times/minutes" patterns
    times_match = re.search(r'for\s+\$([\d.]+).*?(\d+)\s+times', text_lower)
    if times_match:
        dollar_amount = float(times_match.group(1))
        runs = float(times_match.group(2))
        price_per_run = dollar_amount / runs
        return f"run * {price_per_run:.4f}"
    
    minutes_match = re.search(r'for\s+\$([\d.]+).*?(\d+)\s+minutes?', text_lower)
    if minutes_match:
        dollar_amount = float(minutes_match.group(1))
        minutes = float(minutes_match.group(2))
        price_per_minute = dollar_amount / minutes
        return f"minute * {price_per_minute:.4f}"
    
    seconds_match = re.search(r'for\s+\$([\d.]+).*?(\d+)\s+seconds?', text_lower)
    if seconds_match:
        dollar_amount = float(seconds_match.group(1))
        seconds = float(seconds_match.group(2))
        price_per_second = dollar_amount / seconds
        return f"second * {price_per_second:.4f}"
    
    # Handle quality-based pricing
    if 'low quality' in text_lower or 'medium quality' in text_lower or 'high quality' in text_lower:
        quality_prices = {}
        for quality in ['low', 'medium', 'high', 'best']:
            match = re.search(rf'{quality}\s+quality.*?\$([\d.]+)', text_lower)
            if match:
                quality_prices[quality] = match.group(1)
        
        if len(quality_prices) >= 2:
            lines = []
            for quality, price in quality_prices.items():
                quality_var = quality.capitalize()
                lines.append(f"{quality_var} quality: {price}")
            return '\n'.join(lines)
    
    # Default: return first price with generic unit
    return f"unit * {prices[0]}"

# Load JSON data
with open('fal-prices.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create CSV
with open('fal-prices.csv', 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    
    # Write header
    writer.writerow(['Model ID', 'Plain Text', 'Inference Formula'])
    
    # Process each entry
    for key, html_value in data.items():
        plain_text = strip_html(html_value)
        formula = create_inference_formula(plain_text)
        writer.writerow([key, plain_text, formula])

print(f"Created fal-prices.csv with {len(data)} entries")

