import re
import os
import json
import requests

f = open('links.txt')
links = f.read().split('\n')
f.close()

for link in links:
  filename = os.path.join('fal-html', link.replace('/', '_') + '.html')
  if os.path.exists(filename):
    continue

  try:
    response = requests.get(f'https://fal.ai/models/{link}')
    with open(filename, 'w') as f:
      f.write(response.text)

    print(f'Saved {filename}')
  except Exception as e:
    print(f'Error: {e}')


regex = re.compile(r'<div class="flex items-center p-4 pt-4 text-sm text-content-light"><div><p>(.+?)</p></div></div>', re.DOTALL)
regex2 = re.compile(r'<div class="flex flex-col items-start space-y-3"><div class="space-y-3"><p>(.+?)</p></div></div>', re.DOTALL)

prices = {}

for link in links:
  filename = os.path.join('fal-html', link.replace('/', '_') + '.html')
  if not os.path.exists(filename):
    continue

  with open(filename, 'r') as f:
    html = f.read()

  match = regex.search(html)
  if match:
    #print(link, match.group(1))
    prices[link] = match.group(1)
  else:
    match = regex2.search(html)
    if match:
      #print(link, match.group(1))
      prices[link] = match.group(1)
    else:
      print(f'No match found for {link}')

# print(json.dumps(prices, indent=2))
#print('done!')