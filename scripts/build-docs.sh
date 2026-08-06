#!/usr/bin/env bash
# Renders the two hand-off PDFs from their HTML sources using headless Chrome.
set -euo pipefail
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Chrome not found. Set CHROME=/path/to/chrome"; exit 1; }
for doc in "presentation:Caspian-Watch-Презентация" "documentation:Caspian-Watch-Документация"; do
  src="${doc%%:*}"; out="${doc##*:}"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="docs/${out}.pdf" "file://$PWD/docs/${src}.html" 2>/dev/null
  echo "docs/${out}.pdf ✓"
done
