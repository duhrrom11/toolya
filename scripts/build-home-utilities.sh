#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
input=$(mktemp)
trap 'rm -f "$input"' EXIT

printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > "$input"
npm exec --yes --package=tailwindcss@3.4.17 -- tailwindcss \
  --input "$input" \
  --content 'index.html,assets/helferlein-b3-startseite.js,assets/helferlein-accessibility.js,assets/helferlein-dialogs.js,assets/toolya-consent.js,shared/toolya/*.{js,mjs}' \
  --output assets/toolya-home-utilities.css --minify
