#!/usr/bin/env bash
set -euo pipefail

ROOT="artifacts/nexus-aparelhos"
OUTPUT="$ROOT/index.html"
: > "$OUTPUT"
for part in "$ROOT"/.index-source.hex*; do
  xxd -r -p "$part" >> "$OUTPUT"
done
echo "index.html reconstruído em $OUTPUT"
