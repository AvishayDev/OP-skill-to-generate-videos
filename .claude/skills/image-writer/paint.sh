#!/usr/bin/env bash
# Compile the image-writer kit + one painting and render it.
#   paint.sh <Painting.java> <OUT> [Studio options]
#   OUT: still.png | name-grid.jpg (6-frame contact sheet) | film.mp4 (frames → ffmpeg, resumable) | a directory
#   options: --size 1080x1920 --seconds 6 --fps 30 --at 0 --aa 2 --set key=value --keep-frames
# The painting is a Java file in the default package (no `package` line) whose class has the file's name.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$1"; OUT="$2"; shift 2
CLS="$(basename "$SRC" .java)"
# Same code + same options → same stamp: a rerun reuses the build and continues an interrupted film.
STAMP="$( (cat "$HERE"/kit/*.java "$SRC"; echo "$*") | sha1sum | cut -c1-16)"
BUILD="${TMPDIR:-/tmp}/image-writer/$CLS-$STAMP"
if [ ! -f "$BUILD/$CLS.class" ]; then
  mkdir -p "$BUILD"
  javac -encoding UTF-8 -d "$BUILD" "$HERE"/kit/*.java "$SRC"
fi
exec java -Djava.awt.headless=true -Dfile.encoding=UTF-8 -cp "$BUILD" imagewriter.Studio "$CLS" "$OUT" --stamp "$STAMP" "$@"
