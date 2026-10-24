#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$ROOT_DIR/src"
OUT_DIR="$ROOT_DIR/out"

mkdir -p "$OUT_DIR"

for f in "$SRC_DIR"/*.puml; do
  base="$(basename "$f" .puml)"
  out="$OUT_DIR/$base.png"

  # Kroki renders PlantUML without requiring Java locally
  curl -sS -X POST \
    -H "Content-Type: text/plain" \
    --data-binary @"$f" \
    "https://kroki.io/plantuml/png" \
    -o "$out"

  if [[ ! -s "$out" ]]; then
    echo "Failed to render: $f" >&2
    exit 1
  fi

  echo "Rendered $out"
done

