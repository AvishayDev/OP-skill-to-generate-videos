#!/bin/bash
# Fetches the third-party skill packs listed in library/sources.json at their pinned commits, keeping only the
# listed paths, into library/<pack>/. Usage: library/fetch.sh [pack ...]   (no args = all packs)
# Review what lands here before using it: it is other people's code and instructions.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
CACHE="$ROOT/.cache/library"
mkdir -p "$CACHE"
packs=("$@")
[ ${#packs[@]} -eq 0 ] && mapfile -t packs < <(node -e 'const s=require(process.argv[1]);console.log(Object.keys(s.packs).join("\n"))' "$ROOT/library/sources.json")
for pack in "${packs[@]}"; do
  read -r repo commit paths < <(node -e 'const s=require(process.argv[1]).packs[process.argv[2]];if(!s)process.exit(3);console.log(s.repo,s.commit,s.paths.join(","))' "$ROOT/library/sources.json" "$pack") || { echo "unknown pack: $pack" >&2; exit 2; }
  src="$CACHE/${repo//\//_}"
  if [ ! -d "$src/.git" ]; then git clone -q --filter=blob:none --no-checkout "https://github.com/$repo" "$src"; fi
  git -C "$src" fetch -q --depth 1 origin "$commit" 2>/dev/null || git -C "$src" fetch -q origin
  git -C "$src" checkout -q "$commit" 2>/dev/null || git -C "$src" checkout -q "$(git -C "$src" rev-parse --verify "$commit^{commit}")"
  dest="$ROOT/library/$pack"
  rm -rf "$dest"; mkdir -p "$dest"
  IFS=',' read -ra list <<< "$paths"
  for p in "${list[@]}"; do
    if [ -d "$src/$p" ] && [ "$p" = "skills" ]; then cp -R "$src/$p/." "$dest/"; else cp -R "$src/$p" "$dest/"; fi
  done
  for lic in LICENSE LICENSE.md LICENSE.txt NOTICE; do [ -f "$src/$lic" ] && cp "$src/$lic" "$dest/"; done
  echo "✔ $pack ← $repo@$commit ($(find "$dest" -name SKILL.md | wc -l) skills)"
done
