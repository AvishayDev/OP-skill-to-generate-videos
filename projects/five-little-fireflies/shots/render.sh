#!/usr/bin/env bash
# Paint every clip shot of the film with Fireflies.java (image-writer), each a window of the same world.
#   projects/five-little-fireflies/shots/render.sh [--grid] [shot-id…]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
P=projects/five-little-fireflies
GRID=0; [ "${1:-}" = "--grid" ] && { GRID=1; shift; }
node $P/shots/timeline.mjs
node pipeline/cli.mjs shots $P | grep -E '^[a-z]+-[a-z] ' | while read -r id from len _ file _ frames _; do
  [ $# -gt 0 ] && [[ " $* " != *" $id "* ]] && continue
  from="${from%s}"; secs=$(echo "$frames / 24" | bc -l)
  out=$P/clips-src/$id.mp4; [ $GRID = 1 ] && out=$P/frames/$id-grid.jpg
  .claude/skills/image-writer/paint.sh $P/shots/Fireflies.java "$out" --size 1920x1080 --fps 24 --seconds "$secs" \
    --set shot=$id --set t0=$from --set timeline=$P/shots/timeline.txt --set font=$P/fonts/Fredoka-700.ttf < /dev/null 2>&1 | grep -v JAVA_TOOL | tail -4
done
