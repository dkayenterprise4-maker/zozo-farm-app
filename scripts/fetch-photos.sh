#!/usr/bin/env bash
# Downloads the farm photos listed in scripts/photos.txt from Wikimedia Commons
# and saves small, phone-friendly WebP copies in public/photos/.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/photos
UA="ZozoFarmApp/1.0 (photo fetch script)"
while IFS='|' read -r key file artist license; do
  [ -z "$key" ] && continue
  enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$file")
  curl -fsSL -A "$UA" -o "/tmp/$key.jpg" "https://commons.wikimedia.org/wiki/Special:FilePath/$enc?width=1400"
  convert "/tmp/$key.jpg" -auto-orient -strip -resize '800x800>' -quality 55 "public/photos/$key.webp"
  convert "/tmp/$key.jpg" -auto-orient -strip -resize '480x480^' -gravity center -extent 480x360 -quality 55 "public/photos/${key}-sm.webp"
  sleep 1
done < scripts/photos.txt
ls -la public/photos
