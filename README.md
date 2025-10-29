# AI Price Table

AI inference pricing is difficult.

Each model is priced in different units, such as: per mega pixels, per compute seconds, per output seconds, per 1,000 tokens, per 1,000,000 tokens, etc.

It's challenging to estimate or compare the actual costs, especially when the pricing isn't clear to begin with!

Here are a few **actual** pricing examples:

> Your request will cost $0.0011 per second.

what second? compute second? audio input second? video output second?

> Your request will cost $0.8 per 5 video.

why not just "$0.16 per video"??

> Your request will cost $0.001 per megapixel of video data (width × height × frames). For example, if your upscaled video is 1920×1080 with 121 frames, the total cost will be $0.25.

why not "$1 for 20 seconds Full HD video"?

> Your request will cost $0.80 to generate one four-second video. For $1 you can run this model approximately 1 time.
> 
> Additional seconds will cost $0.20 each, calculated at 24 frames per second.
> 
> Additional inference steps above 16 incur a 1/16 multiplier each, such that your total cost will be multiplied x2 at 32 steps, x3 at 48 and x4 at 64.

*sigh...*

**AI Price Table** simplifies this! It offers search, instant filtering by input, output, price unit type.


## Contributing

the simplest way to contribute is to simply edit `data/prices-v1.csv` with more entries.

otherwise feel free to discuss here on github or reach out to me on [x.com/high_byte](https://x.com/high_byte)

## Converting CSV to JSON

for simplicity there is a CSV file for humans and a JSON file for the web app.

to convert the CSV to JSON simply run:

```sh
python scripts/csv_to_json.py data/prices-v1.csv src/data/prices-v1.json
```


## Building

```sh
pnpm run build
```
